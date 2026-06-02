/**
 * Resolve ACF field configs from their field key.
 *
 * In ACF, every value meta row `foo` has a sibling pointer meta row `_foo`
 * whose value is the field key (e.g. `field_5f8a3c2d`). To know how to
 * interpret the value (text vs image vs repeater) we must look up that key
 * either in `wp_posts` (type=acf-field) or in a JS-registered map.
 */

import { Post, getConnection, maybeUnserialize, type WpConnection } from '@kieusonlam/wp-core';
import { getFieldConfigByKey } from './registry.js';
import type { AcfFieldConfig, AcfOptions } from './types.js';

/** In-memory cache of resolved field keys per connection. */
const cache = new WeakMap<WpConnection, Map<string, AcfFieldConfig | null>>();

export class FieldResolver {
  protected readonly source: 'db' | 'php' | 'auto';
  protected readonly conn: WpConnection;

  constructor(options: AcfOptions = {}, connection?: WpConnection) {
    this.source = options.fieldConfigSource ?? 'auto';
    this.conn = connection ?? getConnection();
    if (!cache.has(this.conn)) cache.set(this.conn, new Map());
  }

  /** Load a field config by its key (`field_xxx`). */
  async resolve(fieldKey: string): Promise<AcfFieldConfig | null> {
    const cached = cache.get(this.conn)?.get(fieldKey);
    if (cached !== undefined) return cached;

    let config: AcfFieldConfig | null = null;

    // 1. PHP/JS in-memory source
    if (this.source === 'php' || this.source === 'auto') {
      const reg = getFieldConfigByKey(fieldKey);
      if (reg) config = reg;
    }

    // 2. DB lookup (post_type=acf-field, post_name=fieldKey)
    if (!config && (this.source === 'db' || this.source === 'auto')) {
      const post = await Post.query()
        .type('acf-field')
        .slug(fieldKey)
        .where({ post_status: 'publish' })
        .first();
      if (post) {
        // ACF stores the field config as PHP-serialized in post_content.
        const raw = post.raw.post_content;
        const decoded = typeof raw === 'string' ? maybeUnserialize(raw) : raw;
        if (decoded && typeof decoded === 'object' && !Array.isArray(decoded)) {
          config = {
            key: fieldKey,
            name: post.raw.post_excerpt || post.title,
            type: 'text',
            ...(decoded as Record<string, unknown>),
          } as AcfFieldConfig;
        } else {
          // Fall back to lightweight metadata
          config = {
            key: fieldKey,
            name: post.raw.post_excerpt || post.title,
            type: 'text',
          };
        }
      }
    }

    cache.get(this.conn)!.set(fieldKey, config);
    return config;
  }

  /** Bulk-load sub-fields by their parent post id (the parent acf-field). */
  async subFieldsOf(parentKey: string): Promise<AcfFieldConfig[]> {
    const parent = await Post.query()
      .type('acf-field')
      .slug(parentKey)
      .where({ post_status: 'publish' })
      .first();
    if (!parent) return [];
    const subs = await Post.query()
      .type('acf-field')
      .where({ post_parent: parent.ID, post_status: 'publish' })
      .orderBy('menu_order', 'ASC')
      .all();
    return subs.map((p) => {
      const raw = p.raw.post_content;
      const decoded = typeof raw === 'string' ? maybeUnserialize(raw) : raw;
      const cfg: AcfFieldConfig = {
        key: p.raw.post_name,
        name: p.raw.post_excerpt || p.title,
        type: 'text',
        ...(decoded && typeof decoded === 'object' && !Array.isArray(decoded)
          ? (decoded as Record<string, unknown>)
          : {}),
      } as AcfFieldConfig;
      return cfg;
    });
  }
}

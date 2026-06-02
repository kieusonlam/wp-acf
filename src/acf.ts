/**
 * `Acf` — the user-facing ACF accessor for a Post.
 *
 * Usage:
 *   const post = await Post.findOrFail(123);
 *   const acf  = new Acf(post);
 *   const hero = await acf.get('hero_title');         // typed by field config
 *   const all  = await acf.toObject();                 // resolve every field
 *
 * Typed access:
 *   const img: Attachment | null = await acf.image('hero_image');
 *   const list: Post[]           = await acf.relationship('related');
 *   const flex: FlexibleLayout[] = await acf.flexible('sections');
 */

import {
  getConnection,
  Post,
  type Attachment,
  type MetaValue,
  type Taxonomy,
  type User,
  type WpConnection,
} from '@kieusonlam/wp-core';
import { FieldResolver } from './field-resolver.js';
import { AcfField, type FieldContext } from './fields/base.js';
import './fields/index.js'; // ensure all field types are registered
import type { GroupLayout, RepeaterLayout, FlexibleLayout } from './fields/layouts.js';
import type { AcfLink } from './fields/link.js';
import type { DateTime } from 'luxon';
import type { AcfFieldConfig, AcfOptions, MetaSource } from './types.js';

export class Acf {
  protected readonly source: MetaSource;
  protected readonly resolver: FieldResolver;
  protected readonly conn: WpConnection;
  protected readonly cache = new Map<string, unknown>();

  constructor(source: MetaSource, options: AcfOptions = {}, connection?: WpConnection) {
    this.source = source;
    this.conn = connection ?? getConnection();
    this.resolver = new FieldResolver(options, this.conn);
  }

  /** Read a field by name. Returns the parsed (typed) value. */
  async get<T = unknown>(name: string): Promise<T> {
    if (this.cache.has(name)) return this.cache.get(name) as T;
    const value = await this.source.getMetaAsync(name);
    const fieldKey = await this.source.getMetaAsync(`_${name}`);
    const config: AcfFieldConfig =
      typeof fieldKey === 'string' ? (await this.resolver.resolve(fieldKey)) ?? fallbackConfig(name) : fallbackConfig(name);

    // Repeater/flex: ensure sub_fields are resolved from DB if missing.
    if (
      (config.type === 'repeater' || config.type === 'flexible_content' || config.type === 'group' || config.type === 'clone') &&
      (!config.sub_fields || config.sub_fields.length === 0)
    ) {
      config.sub_fields = await this.resolver.subFieldsOf(config.key);
    }

    const ctx: FieldContext = {
      source: this.source,
      fullName: name,
      connection: this.conn,
      config,
    };
    const parsed = await AcfField.resolveValue(ctx, value);
    this.cache.set(name, parsed);
    return parsed as T;
  }

  // --- typed accessor sugar ----------------------------------------------

  text(name: string): Promise<string> {
    return this.get<string>(name);
  }
  number(name: string): Promise<number | null> {
    return this.get<number | null>(name);
  }
  boolean(name: string): Promise<boolean> {
    return this.get<boolean>(name);
  }
  image(name: string): Promise<Attachment | null> {
    return this.get<Attachment | null>(name);
  }
  file(name: string): Promise<Attachment | null> {
    return this.get<Attachment | null>(name);
  }
  gallery(name: string): Promise<Attachment[]> {
    return this.get<Attachment[]>(name);
  }
  postObject(name: string): Promise<Post | Post[] | null> {
    return this.get<Post | Post[] | null>(name);
  }
  relationship(name: string): Promise<Post[]> {
    return this.get<Post[]>(name);
  }
  taxonomy(name: string): Promise<Taxonomy | Taxonomy[] | null> {
    return this.get<Taxonomy | Taxonomy[] | null>(name);
  }
  user(name: string): Promise<User | User[] | null> {
    return this.get<User | User[] | null>(name);
  }
  date(name: string): Promise<DateTime | null> {
    return this.get<DateTime | null>(name);
  }
  link(name: string): Promise<AcfLink | null> {
    return this.get<AcfLink | null>(name);
  }
  group(name: string): Promise<GroupLayout> {
    return this.get<GroupLayout>(name);
  }
  repeater(name: string): Promise<RepeaterLayout[]> {
    return this.get<RepeaterLayout[]>(name);
  }
  flexible(name: string): Promise<FlexibleLayout[]> {
    return this.get<FlexibleLayout[]>(name);
  }
  select(name: string): Promise<string | string[] | null> {
    return this.get<string | string[] | null>(name);
  }
  checkbox(name: string): Promise<string[]> {
    return this.get<string[]>(name);
  }

  /** Bulk-resolve every field listed in `names`. */
  async toObject(names: string[]): Promise<Record<string, unknown>> {
    const out: Record<string, unknown> = {};
    for (const n of names) out[n] = await this.get(n);
    return out;
  }
}

/** When no field config exists (e.g. plain meta), treat as a text field. */
function fallbackConfig(name: string): AcfFieldConfig {
  return { key: `field_${name}`, name, type: '__default__' };
}

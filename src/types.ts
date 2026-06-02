/**
 * Public types for @kieusonlam/wp-acf.
 */

import type { MetaValue } from '@kieusonlam/wp-core';

/**
 * Subset of an ACF field definition. ACF stores the full config as PHP-
 * serialized in `wp_posts.post_content` of `post_type='acf-field'` rows.
 */
export interface AcfFieldConfig {
  /** Field key, e.g. `field_5f8a3c2d`. */
  key: string;
  /** Field name (the meta_key suffix users see). */
  name: string;
  /** Field type, e.g. `text`, `image`, `repeater`. */
  type: string;
  /** Sub-fields (for repeater, group, flexible_content layouts). */
  sub_fields?: AcfFieldConfig[];
  /** Flexible content layout definitions. */
  layouts?: Record<
    string,
    { key: string; name: string; label?: string; sub_fields?: AcfFieldConfig[] }
  >;
  /** Default value if no meta row exists. */
  default_value?: MetaValue;
  /** How the field returns its value: `array` | `object` | `id`. */
  return_format?: string;
  /** Other config keys that field-type classes consume directly. */
  [key: string]: MetaValue | undefined;
}

/** Where to load field configs from. */
export interface AcfOptions {
  /**
   * `db`     — load configs from wp_posts (`post_type='acf-field'`).
   * `php`    — load configs from in-memory map (call `registerFieldConfigs`).
   * `auto`   — try `db` first, fall back to `php` when not found.
   */
  fieldConfigSource?: 'db' | 'php' | 'auto';

  /** Pre-loaded PHP field configs (keyed by field key, e.g. `field_xxx`). */
  fieldConfigs?: Record<string, AcfFieldConfig>;

  /** Option page prefix in wp_options. Default `options_`. */
  optionPagePrefix?: string;
}

/** Anything that exposes `getMetaAsync(key)` — a Post or option-page shim. */
export interface MetaSource {
  getMetaAsync(key: string): Promise<MetaValue | undefined>;
}

/**
 * Field-type base class + factory map.
 *
 * Each ACF field type subclasses `AcfField` and implements `parse()`.
 * The factory map at the bottom (`FIELD_TYPES`) is populated by each module
 * via `register(...)`.
 */

import type { MetaValue, WpConnection } from '@kieusonlam/wp-core';
import type { AcfFieldConfig, MetaSource } from '../types.js';

/** Per-resolve context passed to fields. */
export interface FieldContext {
  /** The Post / option-page wrapper we're reading meta from. */
  source: MetaSource;
  /** Field name including any repeater/group prefix (e.g. `gallery_0_image`). */
  fullName: string;
  /** Active DB connection (needed for ID lookups). */
  connection: WpConnection;
  /** The ACF field config. */
  config: AcfFieldConfig;
}

/** Base class for every ACF field type. */
export abstract class AcfField<T = unknown> {
  protected readonly ctx: FieldContext;

  constructor(ctx: FieldContext) {
    this.ctx = ctx;
  }

  /** Subclasses parse the raw meta_value into typed JS data. */
  abstract parse(raw: MetaValue | undefined): Promise<T>;

  /**
   * One-shot helper — instantiate the right subclass for `config.type` and
   * parse the value. Falls back to GenericField for unknown types.
   */
  static async resolveValue(ctx: FieldContext, raw: MetaValue | undefined): Promise<unknown> {
    const cls = FIELD_TYPES.get(ctx.config.type) ?? FIELD_TYPES.get('__default__');
    if (!cls) throw new Error(`No field handler for type "${ctx.config.type}" and no default registered.`);
    const inst = new cls(ctx);
    return inst.parse(raw);
  }
}

/** Constructor type so we can store classes in the map. */
type AcfFieldConstructor = new (ctx: FieldContext) => AcfField<unknown>;

/** Process-wide field-type registry. */
export const FIELD_TYPES = new Map<string, AcfFieldConstructor>();

/** Register an ACF field type. Multiple aliases may map to one class. */
export function registerField(types: string | string[], cls: AcfFieldConstructor): void {
  const list = Array.isArray(types) ? types : [types];
  for (const t of list) FIELD_TYPES.set(t, cls);
}

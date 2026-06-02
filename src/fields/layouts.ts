/**
 * `group`, `repeater`, `flexible_content`, `clone` — nested layouts.
 *
 * ACF stores nested fields in postmeta with a name prefix:
 *
 *   `mygroup_subfield`             ← group
 *   `myrepeater`           = "N"   ← repeater row count
 *   `myrepeater_0_subA`            ← row 0, subA
 *   `myrepeater_0_subB`            ← row 0, subB
 *   `myrepeater_1_subA`            ← row 1, subA
 *   ...
 *
 *   `myflex`              = serialized array of layout names per row
 *   `myflex_0_subA`                ← row 0, first layout's sub
 *
 * We expose these as `GroupLayout`, `RepeaterLayout[]`, `FlexibleLayout[]`.
 */

import type { MetaValue, WpConnection } from '@kieusonlam/wp-core';
import { AcfField, registerField, type FieldContext } from './base.js';
import type { AcfFieldConfig, MetaSource } from '../types.js';

/**
 * A row of named, typed sub-fields. Behaves like a record — `layout.subA`
 * returns the parsed sub-field value.
 */
export class GroupLayout {
  /** Resolved sub-field values, keyed by field name. */
  readonly values: Record<string, unknown> = {};
  /** Sub-field configs (for `toJSON` introspection). */
  readonly configs: AcfFieldConfig[];

  constructor(configs: AcfFieldConfig[]) {
    this.configs = configs;
  }

  get<T = unknown>(name: string): T {
    return this.values[name] as T;
  }

  toJSON(): Record<string, unknown> {
    return serializeLayout(this.values);
  }
}

/** A single row inside a repeater. */
export class RepeaterLayout extends GroupLayout {
  readonly index: number;
  constructor(configs: AcfFieldConfig[], index: number) {
    super(configs);
    this.index = index;
  }
}

/** A single row inside a flexible_content field — knows its layout name. */
export class FlexibleLayout extends GroupLayout {
  readonly index: number;
  readonly layout: string;
  constructor(configs: AcfFieldConfig[], index: number, layout: string) {
    super(configs);
    this.index = index;
    this.layout = layout;
  }

  override toJSON(): Record<string, unknown> {
    return { acf_fc_layout: this.layout, ...serializeLayout(this.values) };
  }
}

function serializeLayout(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (v instanceof GroupLayout) out[k] = v.toJSON();
    else if (Array.isArray(v)) out[k] = v.map((x) => (x instanceof GroupLayout ? x.toJSON() : x));
    else out[k] = v;
  }
  return out;
}

/** Helper: build a {@link FieldContext} for a sub-field. */
function subCtx(parent: FieldContext, sub: AcfFieldConfig, name: string): FieldContext {
  return {
    source: parent.source,
    fullName: name,
    connection: parent.connection,
    config: sub,
  };
}

/** Resolve every sub-field's value under the given prefix. */
async function resolveSubFields(
  parent: FieldContext,
  subs: AcfFieldConfig[],
  prefix: string,
  source: MetaSource,
): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const sub of subs) {
    const fullName = `${prefix}${sub.name}`;
    const raw = await source.getMetaAsync(fullName);
    const ctx = subCtx(parent, sub, fullName);
    out[sub.name] = await AcfField.resolveValue(ctx, raw);
  }
  return out;
}

export class GroupField extends AcfField<GroupLayout> {
  async parse(_raw: MetaValue | undefined): Promise<GroupLayout> {
    const subs = (this.ctx.config.sub_fields ?? []) as AcfFieldConfig[];
    const layout = new GroupLayout(subs);
    const prefix = `${this.ctx.fullName}_`;
    const values = await resolveSubFields(this.ctx, subs, prefix, this.ctx.source);
    Object.assign(layout.values, values);
    return layout;
  }
}

export class RepeaterField extends AcfField<RepeaterLayout[]> {
  async parse(raw: MetaValue | undefined): Promise<RepeaterLayout[]> {
    const count = parseRowCount(raw);
    if (count <= 0) return [];
    const subs = (this.ctx.config.sub_fields ?? []) as AcfFieldConfig[];
    const rows: RepeaterLayout[] = [];
    for (let i = 0; i < count; i++) {
      const row = new RepeaterLayout(subs, i);
      const prefix = `${this.ctx.fullName}_${i}_`;
      const values = await resolveSubFields(this.ctx, subs, prefix, this.ctx.source);
      Object.assign(row.values, values);
      rows.push(row);
    }
    return rows;
  }
}

export class FlexibleContentField extends AcfField<FlexibleLayout[]> {
  async parse(raw: MetaValue | undefined): Promise<FlexibleLayout[]> {
    const layoutNames: string[] = [];
    if (Array.isArray(raw)) {
      for (const v of raw) if (typeof v === 'string') layoutNames.push(v);
    } else if (typeof raw === 'object' && raw) {
      for (const v of Object.values(raw)) if (typeof v === 'string') layoutNames.push(v);
    } else if (typeof raw === 'string' && raw.length > 0) {
      try {
        const j = JSON.parse(raw);
        if (Array.isArray(j)) for (const v of j) if (typeof v === 'string') layoutNames.push(v);
      } catch {
        layoutNames.push(raw);
      }
    }
    const layoutsCfg = (this.ctx.config.layouts ?? {}) as Record<
      string,
      { name: string; sub_fields?: AcfFieldConfig[] }
    >;
    const rows: FlexibleLayout[] = [];
    for (let i = 0; i < layoutNames.length; i++) {
      const layoutName = layoutNames[i];
      const layoutDef = Object.values(layoutsCfg).find((l) => l.name === layoutName);
      const subs = (layoutDef?.sub_fields ?? []) as AcfFieldConfig[];
      const row = new FlexibleLayout(subs, i, layoutName);
      const prefix = `${this.ctx.fullName}_${i}_`;
      const values = await resolveSubFields(this.ctx, subs, prefix, this.ctx.source);
      Object.assign(row.values, values);
      rows.push(row);
    }
    return rows;
  }
}

/** `clone` — inherits parent's sub-fields directly; we just expose them flat. */
export class CloneField extends AcfField<GroupLayout> {
  async parse(_raw: MetaValue | undefined): Promise<GroupLayout> {
    const subs = (this.ctx.config.sub_fields ?? []) as AcfFieldConfig[];
    const layout = new GroupLayout(subs);
    const prefix = this.ctx.config.prefix_name ? `${this.ctx.fullName}_` : '';
    const values = await resolveSubFields(this.ctx, subs, prefix, this.ctx.source);
    Object.assign(layout.values, values);
    return layout;
  }
}

function parseRowCount(raw: MetaValue | undefined): number {
  if (raw === null || raw === undefined || raw === '') return 0;
  if (typeof raw === 'number') return Math.max(0, raw);
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  if (Array.isArray(raw)) return raw.length;
  if (typeof raw === 'object') return Object.keys(raw).length;
  return 0;
}

registerField('group', GroupField);
registerField('repeater', RepeaterField);
registerField('flexible_content', FlexibleContentField);
registerField('clone', CloneField);

// Provide a no-op connection-bound helper for layouts to use later
export type { WpConnection };

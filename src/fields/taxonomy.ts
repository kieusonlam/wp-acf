/**
 * `taxonomy` — links to one-or-many `term_taxonomy` rows.
 */

import { Taxonomy } from '@kieusonlam/wp-core';
import type { MetaValue } from '@kieusonlam/wp-core';
import { AcfField, registerField } from './base.js';

export class TaxonomyField extends AcfField<Taxonomy | Taxonomy[] | null> {
  async parse(raw: MetaValue | undefined): Promise<Taxonomy | Taxonomy[] | null> {
    if (raw === null || raw === undefined || raw === '') {
      return Boolean(this.ctx.config.multiple) ? [] : null;
    }
    const ids: number[] = [];
    const list = Array.isArray(raw) ? raw : typeof raw === 'object' ? Object.values(raw) : [raw];
    for (const c of list) {
      if (typeof c === 'number') ids.push(c);
      else if (typeof c === 'string' && /^\d+$/.test(c)) ids.push(parseInt(c, 10));
    }
    const taxes: Taxonomy[] = [];
    for (const id of ids) {
      const t = await Taxonomy.find(id);
      if (t) taxes.push(t);
    }
    if (Boolean(this.ctx.config.multiple) || this.ctx.config.field_type === 'multi_select' || this.ctx.config.field_type === 'checkbox') {
      return taxes;
    }
    return taxes[0] ?? null;
  }
}

registerField('taxonomy', TaxonomyField);

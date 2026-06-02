/**
 * `select`, `checkbox`, `radio` — single or multiple choice fields.
 *
 * ACF stores:
 *   - radio:      string
 *   - select:     string (single) or PHP-array (multi-select)
 *   - checkbox:   PHP-array of strings (always multi)
 */

import { AcfField, registerField } from './base.js';
import type { MetaValue } from '@kieusonlam/wp-core';

export class SelectField extends AcfField<string | string[] | null> {
  async parse(raw: MetaValue | undefined): Promise<string | string[] | null> {
    if (raw === null || raw === undefined || raw === '') return null;
    if (Array.isArray(raw)) return raw.map((v) => String(v));
    if (typeof raw === 'object') return Object.values(raw).map((v) => String(v));
    return String(raw);
  }
}

export class CheckboxField extends AcfField<string[]> {
  async parse(raw: MetaValue | undefined): Promise<string[]> {
    if (raw === null || raw === undefined || raw === '') return [];
    if (Array.isArray(raw)) return raw.map((v) => String(v));
    if (typeof raw === 'object') return Object.values(raw).map((v) => String(v));
    return [String(raw)];
  }
}

export class RadioField extends AcfField<string | null> {
  async parse(raw: MetaValue | undefined): Promise<string | null> {
    if (raw === null || raw === undefined || raw === '') return null;
    return String(raw);
  }
}

registerField('select', SelectField);
registerField('checkbox', CheckboxField);
registerField('radio', RadioField);

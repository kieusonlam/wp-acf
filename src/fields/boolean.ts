/**
 * `true_false` — ACF stores `1` or `0` in the meta_value.
 */

import { AcfField, registerField } from './base.js';
import type { MetaValue } from '@kieusonlam/wp-core';

export class BooleanField extends AcfField<boolean> {
  async parse(raw: MetaValue | undefined): Promise<boolean> {
    if (raw === true || raw === false) return raw;
    if (raw === '1' || raw === 1) return true;
    if (raw === '0' || raw === 0 || raw === '' || raw === null || raw === undefined) return false;
    return Boolean(raw);
  }
}

registerField('true_false', BooleanField);

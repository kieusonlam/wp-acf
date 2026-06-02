/**
 * `date_picker`, `date_time_picker`, `time_picker` — Luxon DateTime values.
 *
 * ACF saves dates in `Y-m-d`, datetimes in `Y-m-d H:i:s`, times in `H:i:s`.
 */

import { DateTime } from 'luxon';
import type { MetaValue } from '@kieusonlam/wp-core';
import { AcfField, registerField } from './base.js';

function tryParse(s: string): DateTime | null {
  // Try common ACF formats in order.
  for (const fmt of ['yyyy-MM-dd HH:mm:ss', 'yyyy-MM-dd', 'HH:mm:ss', 'yyyyMMddHHmmss', 'yyyyMMdd']) {
    const dt = DateTime.fromFormat(s, fmt);
    if (dt.isValid) return dt;
  }
  const iso = DateTime.fromISO(s);
  return iso.isValid ? iso : null;
}

export class DateField extends AcfField<DateTime | null> {
  async parse(raw: MetaValue | undefined): Promise<DateTime | null> {
    if (raw === null || raw === undefined || raw === '') return null;
    if (raw instanceof Date) return DateTime.fromJSDate(raw);
    return typeof raw === 'string' ? tryParse(raw) : null;
  }
}

registerField(['date_picker', 'date_time_picker', 'time_picker'], DateField);

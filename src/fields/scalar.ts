/**
 * Simple scalar field types — return value unchanged or lightly coerced.
 *
 * Covers: text, textarea, number, range, email, url, password, wysiwyg,
 * oembed, page_link, color_picker, button_group.
 */

import { AcfField, registerField } from './base.js';
import type { MetaValue } from '@kieusonlam/wp-core';

/** Text-ish — returns the value as a string (or empty string if null). */
export class TextField extends AcfField<string> {
  async parse(raw: MetaValue | undefined): Promise<string> {
    if (raw === null || raw === undefined) return '';
    return typeof raw === 'string' ? raw : String(raw);
  }
}

/** Number — coerces to JS number. */
export class NumberField extends AcfField<number | null> {
  async parse(raw: MetaValue | undefined): Promise<number | null> {
    if (raw === null || raw === undefined || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
}

/** Generic fallback — returns the raw value as-is. */
export class GenericField extends AcfField {
  async parse(raw: MetaValue | undefined): Promise<MetaValue> {
    return raw ?? '';
  }
}

registerField(
  ['text', 'textarea', 'email', 'url', 'password', 'wysiwyg', 'oembed', 'page_link', 'color_picker', 'button_group'],
  TextField,
);
registerField(['number', 'range'], NumberField);
registerField(['__default__'], GenericField);

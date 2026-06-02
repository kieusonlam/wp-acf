/**
 * `link` — { url, title, target } object (PHP-serialized assoc array).
 */

import type { MetaValue } from '@kieusonlam/wp-core';
import { AcfField, registerField } from './base.js';

export interface AcfLink {
  url: string;
  title: string;
  target: string;
}

export class LinkField extends AcfField<AcfLink | null> {
  async parse(raw: MetaValue | undefined): Promise<AcfLink | null> {
    if (raw === null || raw === undefined || raw === '') return null;
    if (typeof raw === 'string') return { url: raw, title: '', target: '' };
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      const obj = raw as Record<string, MetaValue>;
      return {
        url: String(obj.url ?? ''),
        title: String(obj.title ?? ''),
        target: String(obj.target ?? ''),
      };
    }
    return null;
  }
}

registerField('link', LinkField);

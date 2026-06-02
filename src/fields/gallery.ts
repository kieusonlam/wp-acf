/**
 * `gallery` — ordered list of attachment IDs (PHP-array).
 */

import { Attachment } from '@kieusonlam/wp-core';
import type { MetaValue } from '@kieusonlam/wp-core';
import { AcfField, registerField } from './base.js';

export class GalleryField extends AcfField<Attachment[]> {
  async parse(raw: MetaValue | undefined): Promise<Attachment[]> {
    if (raw === null || raw === undefined || raw === '') return [];
    const ids: number[] = [];
    const candidates = Array.isArray(raw)
      ? raw
      : typeof raw === 'object'
        ? Object.values(raw)
        : [raw];
    for (const c of candidates) {
      if (typeof c === 'number') ids.push(c);
      else if (typeof c === 'string' && /^\d+$/.test(c)) ids.push(parseInt(c, 10));
      else if (typeof c === 'object' && c) {
        const obj = c as Record<string, MetaValue>;
        const v = obj.ID ?? obj.id;
        if (typeof v === 'number') ids.push(v);
        else if (typeof v === 'string' && /^\d+$/.test(v)) ids.push(parseInt(v, 10));
      }
    }
    const out: Attachment[] = [];
    for (const id of ids) {
      const a = await Attachment.find(id);
      if (a) out.push(a as Attachment);
    }
    return out;
  }
}

registerField('gallery', GalleryField);

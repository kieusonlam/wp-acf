/**
 * `image`, `file` — single attachment.
 *
 * ACF stores either the attachment ID (depending on `return_format`), an
 * array, or an object. We always normalize to an `Attachment` (Post wrapper)
 * or `null`.
 */

import { Attachment } from '@kieusonlam/wp-core';
import type { MetaValue } from '@kieusonlam/wp-core';
import { AcfField, registerField } from './base.js';

async function loadAttachment(raw: MetaValue | undefined): Promise<Attachment | null> {
  if (raw === null || raw === undefined || raw === '') return null;
  let id: number | null = null;
  if (typeof raw === 'number') id = raw;
  else if (typeof raw === 'string' && /^\d+$/.test(raw)) id = parseInt(raw, 10);
  else if (typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, MetaValue>;
    const v = obj.ID ?? obj.id;
    if (typeof v === 'number') id = v;
    else if (typeof v === 'string' && /^\d+$/.test(v)) id = parseInt(v, 10);
  }
  if (!id) return null;
  return (await Attachment.find(id)) as Attachment | null;
}

export class ImageField extends AcfField<Attachment | null> {
  async parse(raw: MetaValue | undefined): Promise<Attachment | null> {
    return loadAttachment(raw);
  }
}

export class FileField extends AcfField<Attachment | null> {
  async parse(raw: MetaValue | undefined): Promise<Attachment | null> {
    return loadAttachment(raw);
  }
}

registerField('image', ImageField);
registerField('file', FileField);

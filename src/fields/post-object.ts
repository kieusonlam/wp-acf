/**
 * `post_object`, `relationship` — links to other posts.
 *
 * `post_object` is single-OR-multi depending on the field's `multiple` config.
 * `relationship` is always multi.
 */

import { Post } from '@kieusonlam/wp-core';
import type { MetaValue } from '@kieusonlam/wp-core';
import { AcfField, registerField } from './base.js';

async function loadPosts(raw: MetaValue | undefined): Promise<Post[]> {
  if (raw === null || raw === undefined || raw === '') return [];
  const ids: number[] = [];
  const list = Array.isArray(raw) ? raw : typeof raw === 'object' ? Object.values(raw) : [raw];
  for (const c of list) {
    if (typeof c === 'number') ids.push(c);
    else if (typeof c === 'string' && /^\d+$/.test(c)) ids.push(parseInt(c, 10));
  }
  const out: Post[] = [];
  for (const id of ids) {
    const p = await Post.find(id);
    if (p) out.push(p);
  }
  return out;
}

export class PostObjectField extends AcfField<Post | Post[] | null> {
  async parse(raw: MetaValue | undefined): Promise<Post | Post[] | null> {
    const multi = Boolean(this.ctx.config.multiple);
    const posts = await loadPosts(raw);
    if (multi) return posts;
    return posts[0] ?? null;
  }
}

export class RelationshipField extends AcfField<Post[]> {
  async parse(raw: MetaValue | undefined): Promise<Post[]> {
    return loadPosts(raw);
  }
}

registerField('post_object', PostObjectField);
registerField('relationship', RelationshipField);

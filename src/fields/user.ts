/**
 * `user` — one or many wp_users rows.
 */

import { User } from '@kieusonlam/wp-core';
import type { MetaValue } from '@kieusonlam/wp-core';
import { AcfField, registerField } from './base.js';

export class UserField extends AcfField<User | User[] | null> {
  async parse(raw: MetaValue | undefined): Promise<User | User[] | null> {
    if (raw === null || raw === undefined || raw === '') {
      return this.ctx.config.multiple ? [] : null;
    }
    const ids: number[] = [];
    const list = Array.isArray(raw) ? raw : typeof raw === 'object' ? Object.values(raw) : [raw];
    for (const c of list) {
      if (typeof c === 'number') ids.push(c);
      else if (typeof c === 'string' && /^\d+$/.test(c)) ids.push(parseInt(c, 10));
    }
    const users: User[] = [];
    for (const id of ids) {
      const u = await User.find(id);
      if (u) users.push(u);
    }
    return this.ctx.config.multiple ? users : (users[0] ?? null);
  }
}

registerField('user', UserField);

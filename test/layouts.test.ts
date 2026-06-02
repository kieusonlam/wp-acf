import { describe, expect, it } from 'vitest';
import type { MetaValue } from '@kieusonlam/wp-core';
import '../src/fields/index.js'; // register all built-in field types
import { RepeaterField } from '../src/fields/layouts.js';
import type { FieldContext } from '../src/fields/base.js';
import type { MetaSource } from '../src/types.js';

class InMemoryMetaSource implements MetaSource {
  constructor(private readonly map: Record<string, MetaValue>) {}
  async getMetaAsync(key: string): Promise<MetaValue | undefined> {
    return this.map[key];
  }
}

describe('RepeaterField', () => {
  it('produces N rows of resolved sub-fields', async () => {
    const src = new InMemoryMetaSource({
      bullets: '3',
      bullets_0_label: 'Tản nhiệt nhôm đúc',
      bullets_1_label: 'CRI ≥ 80',
      bullets_2_label: 'IP65 chống nước',
    });
    const ctx = {
      source: src,
      fullName: 'bullets',
      connection: {} as never,
      config: {
        key: 'field_bullets',
        name: 'bullets',
        type: 'repeater',
        sub_fields: [{ key: 'field_label', name: 'label', type: 'text' }],
      },
    } satisfies FieldContext;
    const f = new RepeaterField(ctx);
    const rows = await f.parse('3');
    expect(rows).toHaveLength(3);
    expect(rows[0].get('label')).toBe('Tản nhiệt nhôm đúc');
    expect(rows[1].get('label')).toBe('CRI ≥ 80');
    expect(rows[2].get('label')).toBe('IP65 chống nước');
  });

  it('returns empty array for null/zero counts', async () => {
    const src = new InMemoryMetaSource({});
    const ctx: FieldContext = {
      source: src,
      fullName: 'empty',
      connection: {} as never,
      config: {
        key: 'field_empty',
        name: 'empty',
        type: 'repeater',
        sub_fields: [],
      },
    };
    const f = new RepeaterField(ctx);
    expect(await f.parse(undefined)).toEqual([]);
    expect(await f.parse('0')).toEqual([]);
    expect(await f.parse('')).toEqual([]);
  });

  it('serializes nested rows via toJSON', async () => {
    const src = new InMemoryMetaSource({
      items: '2',
      items_0_title: 'First',
      items_0_score: '10',
      items_1_title: 'Second',
      items_1_score: '20',
    });
    const ctx: FieldContext = {
      source: src,
      fullName: 'items',
      connection: {} as never,
      config: {
        key: 'field_items',
        name: 'items',
        type: 'repeater',
        sub_fields: [
          { key: 'field_title', name: 'title', type: 'text' },
          { key: 'field_score', name: 'score', type: 'number' },
        ],
      },
    };
    const rows = await new RepeaterField(ctx).parse('2');
    const json = rows.map((r) => r.toJSON());
    expect(json).toEqual([
      { title: 'First', score: 10 },
      { title: 'Second', score: 20 },
    ]);
  });
});

/**
 * In-memory registry of ACF field configs (the `php` source).
 *
 * Typical use:
 *
 *   import { registerFieldConfigs } from '@kieusonlam/wp-acf';
 *   registerFieldConfigs({
 *     field_5f8a3c2d: { key: 'field_5f8a3c2d', name: 'hero_title', type: 'text' },
 *     ...
 *   });
 *
 * This mirrors `acf_add_local_field()` in PHP ACF Pro.
 */

import type { AcfFieldConfig } from './types.js';

const REGISTRY = new Map<string, AcfFieldConfig>();
const BY_NAME: Map<string, AcfFieldConfig[]> = new Map();

export function registerFieldConfigs(configs: Record<string, AcfFieldConfig>): void {
  for (const [key, cfg] of Object.entries(configs)) {
    const normalized: AcfFieldConfig = { ...cfg, key };
    REGISTRY.set(key, normalized);
    const arr = BY_NAME.get(cfg.name) ?? [];
    arr.push(normalized);
    BY_NAME.set(cfg.name, arr);
  }
}

export function getFieldConfigByKey(key: string): AcfFieldConfig | undefined {
  return REGISTRY.get(key);
}

export function getFieldConfigByName(name: string): AcfFieldConfig | undefined {
  const arr = BY_NAME.get(name);
  return arr && arr.length > 0 ? arr[0] : undefined;
}

export function clearRegistry(): void {
  REGISTRY.clear();
  BY_NAME.clear();
}

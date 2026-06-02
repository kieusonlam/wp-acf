/**
 * ACF Option pages — values are stored in `wp_options` with prefix `options_`.
 *
 * `AcfOptionSource` wraps `Option.get()` to act like a `MetaSource` so the
 * regular `Acf` class can read option-page fields without changes.
 */

import { Option, type MetaValue, type WpConnection } from '@kieusonlam/wp-core';
import type { AcfOptions, MetaSource } from './types.js';
import { Acf } from './acf.js';

export class AcfOptionSource implements MetaSource {
  protected readonly prefix: string;
  protected readonly connection?: WpConnection;

  constructor(prefix = 'options_', connection?: WpConnection) {
    this.prefix = prefix;
    this.connection = connection;
  }

  async getMetaAsync(key: string): Promise<MetaValue | undefined> {
    return Option.get(`${this.prefix}${key}`, this.connection);
  }
}

/** Helper: create an `Acf` instance reading from the option page. */
export function acfOptions(options: AcfOptions = {}, connection?: WpConnection): Acf {
  const src = new AcfOptionSource(options.optionPagePrefix ?? 'options_', connection);
  return new Acf(src, options, connection);
}

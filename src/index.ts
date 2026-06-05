/**
 * @kieusonlam/wp-acf — Advanced Custom Fields access for the WordPress database.
 *
 * Usage:
 *
 *   import { Post } from '@kieusonlam/wp-core';
 *   import { Acf, acfOptions } from '@kieusonlam/wp-acf';
 *
 *   const post = await Post.findOrFail(123);
 *   const acf  = new Acf(post);
 *   const hero = await acf.text('hero_title');
 *   const img  = await acf.image('hero_image');
 *   const rows = await acf.repeater('features');
 *   for (const row of rows) {
 *     console.log(row.get('title'), row.get('image'));
 *   }
 *
 *   // ACF Option pages
 *   const site = acfOptions();
 *   const phone = await site.text('site_phone');
 *
 *   // ACF gắn trên taxonomy term (category / product_cat / ...)
 *   import { Category } from '@kieusonlam/wp-core';
 *   import { acfTerm } from '@kieusonlam/wp-acf';
 *   const cat = await Category.slugInCategory('tin-tuc');
 *   const intro = cat ? await acfTerm(cat).text('cat_content') : '';
 */

export { Acf } from './acf.js';
export { acfOptions, AcfOptionSource } from './option.js';
export { acfTerm } from './term.js';
export { FieldResolver } from './field-resolver.js';
export {
  registerFieldConfigs,
  getFieldConfigByKey,
  getFieldConfigByName,
  clearRegistry,
} from './registry.js';
export * from './fields/index.js';
export type { AcfFieldConfig, AcfOptions, MetaSource } from './types.js';

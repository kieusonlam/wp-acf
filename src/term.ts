/**
 * ACF trên taxonomy term (category, post_tag, product_cat, …).
 *
 * ACF lưu field gắn-trên-term trong `wp_termmeta` (giống postmeta cho post).
 * `Taxonomy` của wp-core đã là một `MetaSource` (có `getMetaAsync`) nên `Acf`
 * đọc trực tiếp — không cần adapter riêng như Option page:
 *
 *   import { Category } from '@kieusonlam/wp-core';
 *   import { acfTerm } from '@kieusonlam/wp-acf';
 *
 *   const cat = await Category.slugInCategory('tin-tuc');   // -> Taxonomy
 *   if (cat) {
 *     const acf  = acfTerm(cat);
 *     const html = await acf.text('cat_content');           // wysiwyg -> HTML
 *     const faq  = await acf.repeater('faq');               // [{question, answer}, ...]
 *     const img  = await acf.image('cat_thumbnail');        // Attachment | null
 *   }
 *
 * Lần đọc đầu tiên nạp toàn bộ termmeta của term (1 query) rồi cache, nên
 * repeater nhiều dòng không bị N+1.
 */

import type { Taxonomy, WpConnection } from '@kieusonlam/wp-core';
import type { AcfOptions } from './types.js';
import { Acf } from './acf.js';

/**
 * Tạo `Acf` đọc field từ một taxonomy term.
 *
 * @param term  Một `Taxonomy` (đã eager-load `term`, như kết quả của
 *              `Category.slugInCategory()` / `Taxonomy.slug()` / `.find()`).
 * @param options  Tùy chọn ACF (vd `source: 'php'` để dùng field config đăng ký sẵn).
 */
export function acfTerm(term: Taxonomy, options: AcfOptions = {}, connection?: WpConnection): Acf {
  return new Acf(term, options, connection);
}

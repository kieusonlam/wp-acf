# @kieusonlam/wp-acf

## 0.5.0

### Minor changes

- **New: `acfTerm(taxonomy)` — read ACF fields attached to a taxonomy term** (category, `post_tag`, `product_cat`, custom taxonomies). ACF stores term fields in `wp_termmeta`; with wp-core 0.5.0 a `Taxonomy` is now a `MetaSource`, so the existing `Acf` engine reads them with no special-casing — `acfTerm()` is a thin helper mirroring `acfOptions()`.

  ```ts
  import { Category } from '@kieusonlam/wp-core';
  import { acfTerm } from '@kieusonlam/wp-acf';

  const cat = await Category.slugInCategory('tin-tuc'); // Taxonomy
  if (cat) {
    const acf  = acfTerm(cat);
    const html = await acf.text('cat_content');   // wysiwyg → HTML
    const faq  = await acf.repeater('faq');       // [{ question, answer }, ...]
    const img  = await acf.image('cat_thumbnail');
  }
  ```

  All field types (repeater, group, gallery, relationship, …) work as on posts/options. The first read loads the term's full `wp_termmeta` in one query (cached), so repeaters don't N+1.

- Bumps `@kieusonlam/wp-core` peer dependency to `^0.5.0` (requires the term-meta accessor `acfTerm` relies on). Coordinated release with wp-core 0.5.0 + wp-woocommerce 0.5.0.

  When upgrading: `pnpm add @kieusonlam/wp-core@^0.5.0 @kieusonlam/wp-acf@^0.5.0`.

## 0.4.0

### Patch changes

- Bumps `@kieusonlam/wp-core` peer dependency to `^0.4.0`. No code changes — release coordinated with wp-core 0.4.0 (adds `.whereIn()` / `.whereNotIn()` + `Op` re-export) to keep all 3 packages on the same minor version.

  When upgrading: `pnpm add @kieusonlam/wp-core@^0.4.0 @kieusonlam/wp-acf@^0.4.0` (same for npm/yarn).

## 0.3.0

### Patch changes

- Bumps `@kieusonlam/wp-core` peer dependency to `^0.3.0`. No code changes — release coordinated with wp-core to keep all 3 packages on the same minor version.

  When upgrading: `pnpm add @kieusonlam/wp-core@^0.3.0 @kieusonlam/wp-acf@^0.3.0` (same for npm/yarn).

## 0.2.0

Initial public release.

- ACF field reader for all common types: text, textarea, number, boolean, email, url, password, wysiwyg, oembed, page_link, color_picker, button_group, select, checkbox, radio, image, file, gallery, post_object, relationship, taxonomy, user, date_picker, date_time_picker, time_picker, link
- Nested layouts: `group`, `repeater`, `flexible_content`, `clone` with full sub-field resolution
- ACF Pro **option pages** via `acfOptions()`
- Field config from DB (`acf-field` post type) or registered programmatically via `registerFieldConfigs()`
- Per-request caching of resolved values
- TypeScript-first, ESM + CJS output, MIT licensed

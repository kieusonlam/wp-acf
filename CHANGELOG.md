# @kieusonlam/wp-acf

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

# @kieusonlam/wp-acf

> Read **Advanced Custom Fields** data straight from the WordPress database in Node.js / TypeScript. Supports every common ACF field type — text, image, gallery, post object, relationship, taxonomy, user, date, link — plus nested repeaters, flexible content, groups, clones, and option pages.

[![npm](https://img.shields.io/npm/v/@kieusonlam/wp-acf?color=blue)](https://www.npmjs.com/package/@kieusonlam/wp-acf)
[![license](https://img.shields.io/npm/l/@kieusonlam/wp-acf)](./LICENSE)

---

## Install

```sh
pnpm add @kieusonlam/wp-core @kieusonlam/wp-acf
```

> Requires [`@kieusonlam/wp-core`](https://github.com/kieusonlam/wp-core) as a peer dependency — it owns the DB connection and Post model.

---

## Quickstart

```ts
import { connect, Post } from '@kieusonlam/wp-core';
import { Acf, acfOptions } from '@kieusonlam/wp-acf';

connect({ host: '127.0.0.1', user: 'root', password: '', database: 'wordpress' });

const post = await Post.findOrFail(123);
const acf  = new Acf(post);

const title    = await acf.text('hero_title');           // string
const image    = await acf.image('hero_image');          // Attachment | null
const photos   = await acf.gallery('photos');            // Attachment[]
const related  = await acf.relationship('related_posts'); // Post[]
const sections = await acf.flexible('page_sections');    // FlexibleLayout[]

for (const s of sections) {
  console.log(s.layout, s.toJSON());
}
```

---

## Table of contents

- [How ACF stores data](#how-acf-stores-data)
- [The `Acf` class](#the-acf-class)
- [Field reference (every type)](#field-reference)
  - [Scalar: text, number, email, …](#scalar)
  - [Boolean (true_false)](#boolean)
  - [Select / Checkbox / Radio](#select-checkbox)
  - [Image / File](#image-file)
  - [Gallery](#gallery)
  - [Post Object / Relationship](#post-object-relationship)
  - [Taxonomy](#taxonomy-field)
  - [User](#user-field)
  - [Date / DateTime / Time](#date-field)
  - [Link](#link-field)
  - [Group](#group-field)
  - [Repeater](#repeater-field)
  - [Flexible Content](#flexible-field)
  - [Clone](#clone-field)
- [Option pages](#option-pages)
- [Term fields (category / product_cat)](#term-fields)
- [Field config sources (DB vs registry)](#field-configs)
- [Bulk resolve + serializing to JSON](#bulk-resolve)
- [TypeScript](#typescript)
- [Recipes](#recipes)
- [FAQ](#faq)

---

<a id="how-acf-stores-data"></a>
## 🧬 How ACF stores data (you don't need to memorize this — but it helps)

ACF saves field values in plain `wp_postmeta` rows. Each value comes in **pairs**: the value itself plus a pointer to the field's *key* config:

| `meta_key` | `meta_value` |
|---|---|
| `hero_title` | `Welcome to POTECH` |
| `_hero_title` | `field_5f8a3c2d` |
| `gallery_items` | `3` (row count) |
| `_gallery_items` | `field_6a1c8b40` |
| `gallery_items_0_caption` | `Lighting demo` |
| `_gallery_items_0_caption` | `field_6a1c8b41` |

The `Acf` class hides this — you just call `acf.text('hero_title')`.

---

<a id="the-acf-class"></a>
## 🎛 The `Acf` class

```ts
import { Acf } from '@kieusonlam/wp-acf';

const post = await Post.findOrFail(123);
const acf = new Acf(post);                        // wraps any MetaSource (Post, User, Term, custom)

// Generic accessor — returns whatever the field config says
const v = await acf.get<string>('hero_title');

// Typed sugar — every common type has its own method (no generics required)
await acf.text('hero_title');
await acf.number('display_count');
await acf.boolean('is_featured');
await acf.image('hero_image');
await acf.file('datasheet_pdf');
await acf.gallery('photos');
await acf.postObject('linked_product');
await acf.relationship('related_posts');
await acf.taxonomy('industry');
await acf.user('account_manager');
await acf.date('event_date');
await acf.link('cta');
await acf.group('contact_info');
await acf.repeater('features');
await acf.flexible('page_sections');
await acf.select('status');
await acf.checkbox('tags');

// Auto-caches per-call — calling twice doesn't hit the DB twice
await acf.text('hero_title');
await acf.text('hero_title');  // ← cached
```

---

<a id="field-reference"></a>
## 📚 Field reference — every type with response sample

<a id="scalar"></a>
### Scalar — text, textarea, email, url, password, wysiwyg, oembed, page_link, color_picker, button_group

```ts
const title = await acf.text('hero_title');
// → "Welcome to POTECH"

const desc = await acf.text('long_description');
// → "<p>POTECH provides industrial LED lighting...</p>"
//   (WYSIWYG returns raw HTML — sanitize it yourself with DOMPurify if you embed user input)

const color = await acf.text('brand_color');
// → "#1d4ed8"
```

<a id="boolean"></a>
### Boolean (true_false)

```ts
await acf.boolean('is_featured');
// → true

await acf.boolean('show_pricing');
// → false
```

ACF stores `1` / `0`. We normalize to `boolean`.

<a id="select-checkbox"></a>
### Select / Checkbox / Radio

```ts
// Single-value select  →  string
await acf.select('status');           // → "active"

// Multi-select         →  string[]
await acf.select('tags');             // → ["led", "highbay", "vietnam"]

// Checkbox             →  string[]
await acf.checkbox('certifications'); // → ["CE", "RoHS", "FCC"]

// Radio                →  string | null
await acf.get<string>('shape');       // → "round"
```

<a id="image-file"></a>
### Image / File

Returns an `Attachment` (a typed `Post` subclass) — you decide whether to read `.url()` / `.filePath()` / `.fileMetadata()`.

```ts
const img = await acf.image('hero_image');
if (img) {
  await img.filePath();
  // → "2026/05/hero-highbay.jpg"

  await img.fileMetadata();
  // → { width: 1920, height: 1080, file: "2026/05/hero-highbay.jpg",
  //     sizes: { thumbnail: {...}, medium: {...}, large: {...} } }

  await img.url('https://example.com/wp-content/uploads', 'large');
  // → "https://example.com/wp-content/uploads/2026/05/hero-highbay-1024x576.jpg"
}

const pdf = await acf.file('datasheet_pdf');
// → Attachment | null   (mime_type = 'application/pdf')
```

<a id="gallery"></a>
### Gallery

```ts
const photos = await acf.gallery('product_photos');
// → Attachment[]

photos[0].ID;           // 456
await photos[0].url('https://example.com/wp-content/uploads', 'medium');
```

<a id="post-object-relationship"></a>
### Post Object / Relationship

```ts
// Single (Post Object — `return_format = object`)
const linked = await acf.postObject('linked_product');
// → Post | null  (the Post wrapping wp_posts row, fully typed)

// Multi (Post Object with multiple=true OR Relationship)
const related = await acf.relationship('related_posts');
// → Post[]

related[0].title;       // "Khu phức hợp Vincom Mega Mall"
related[0].slug;        // "vincom-mega-mall"
related[0].type;        // "project"
```

<a id="taxonomy-field"></a>
### Taxonomy

```ts
const ind = await acf.taxonomy('industry');
// → Taxonomy | Taxonomy[] | null

if (Array.isArray(ind)) {
  for (const t of ind) console.log(t.slug, t.name);
} else if (ind) {
  console.log(ind.slug, ind.name);
}
```

<a id="user-field"></a>
### User

```ts
const u = await acf.user('account_manager');
// → User | User[] | null

if (u && !Array.isArray(u)) {
  console.log(u.displayName, u.email);
}
```

<a id="date-field"></a>
### Date / DateTime / Time

Returns a `DateTime` from [luxon](https://moment.github.io/luxon/).

```ts
import type { DateTime } from 'luxon';

const dt = await acf.date('event_date');
if (dt) {
  dt.toISO();                 // "2026-08-15T19:00:00.000+07:00"
  dt.toFormat('dd/MM/yyyy');  // "15/08/2026"
  dt.toRelative();            // "in 2 months"
}
```

<a id="link-field"></a>
### Link

```ts
const cta = await acf.link('cta');
// → { url: 'https://...', title: 'Liên hệ tư vấn', target: '_blank' } | null
```

<a id="group-field"></a>
### Group

```ts
const info = await acf.group('contact_info');
// info is a GroupLayout with parsed sub-fields:
info.get<string>('phone');           // "0903-123-456"
info.get<string>('email');           // "hi@potech.com.vn"
info.get<string>('address');         // "123 Nguyễn Trãi, Q.1, HCMC"

info.toJSON();
// → { phone: "0903-123-456", email: "hi@potech.com.vn", address: "123 Nguyễn Trãi..." }
```

<a id="repeater-field"></a>
### Repeater

The most common nested layout — an array of typed rows.

```ts
const features = await acf.repeater('features');
// → RepeaterLayout[]

for (const row of features) {
  row.index;                          // 0, 1, 2, ...
  row.get<string>('label');           // "Tiết kiệm điện 60%"
  const icon = row.get<Attachment | null>('icon');
  if (icon) await icon.url(BASE_URL);
}

// Serialize all rows
JSON.stringify(features.map((r) => r.toJSON()), null, 2);
```

**Response sample** — `acf.repeater('features')`:

```jsonc
[
  {
    "index": 0,
    "label": "Tiết kiệm điện 60%",
    "icon": {
      "ID": 502,
      "title": "icon-power-savings",
      "filePath": "2026/05/icon-power.svg"
    },
    "value": "60%"
  },
  {
    "index": 1,
    "label": "Tuổi thọ 50,000 giờ",
    "icon": { "ID": 503, "title": "icon-lifespan" },
    "value": "50000h"
  },
  {
    "index": 2,
    "label": "Bảo hành 5 năm",
    "icon": { "ID": 504, "title": "icon-warranty" },
    "value": "5y"
  }
]
```

<a id="flexible-field"></a>
### Flexible Content

Page-builder style — each row picks one of N predefined layouts.

```ts
const sections = await acf.flexible('page_sections');
// → FlexibleLayout[]

for (const section of sections) {
  section.layout;                  // "hero" | "feature_grid" | "cta_band" | ...
  section.index;                   // 0, 1, 2, ...

  if (section.layout === 'hero') {
    const title = section.get<string>('title');
    const image = section.get<Attachment | null>('image');
    // render hero ...
  } else if (section.layout === 'feature_grid') {
    const rows = section.get<RepeaterLayout[]>('items');
    // render grid ...
  }
}
```

**Response sample** — `acf.flexible('page_sections')` serialized:

```jsonc
[
  {
    "acf_fc_layout": "hero",
    "title": "Giải pháp chiếu sáng LED công nghiệp",
    "subtitle": "Tiết kiệm 60% chi phí điện",
    "image": { "ID": 502, "title": "hero-image" },
    "cta": { "url": "/contact", "title": "Liên hệ", "target": "" }
  },
  {
    "acf_fc_layout": "feature_grid",
    "heading": "Vì sao chọn POTECH?",
    "items": [
      { "label": "Hiệu suất 180lm/W", "icon": { "ID": 503 } },
      { "label": "L70 = 100,000h",    "icon": { "ID": 504 } }
    ]
  },
  {
    "acf_fc_layout": "cta_band",
    "text": "Cần tư vấn dự án?",
    "button_label": "Yêu cầu báo giá",
    "button_url": "/contact"
  }
]
```

<a id="clone-field"></a>
### Clone

Clones flatten a referenced field group inline. Returns a `GroupLayout`:

```ts
const seoMeta = await acf.group('seo_meta');
seoMeta.get<string>('title');
seoMeta.get<string>('description');
seoMeta.get<Attachment | null>('og_image');
```

---

<a id="option-pages"></a>
## ⚙️ Option pages

ACF Pro option pages store data in `wp_options` (not postmeta) — values prefixed with `options_`. Wrap that source with `acfOptions()`:

```ts
import { acfOptions } from '@kieusonlam/wp-acf';

const site = acfOptions();

await site.text('contact_phone');       // → "+84 903 123 456"
await site.text('contact_email');       // → "hi@potech.com.vn"
await site.image('site_logo');          // → Attachment | null
await site.repeater('social_links');    // → RepeaterLayout[]

// Custom prefix (if you renamed your option page):
const dashboard = acfOptions({ optionPagePrefix: 'dashboard_' });
const layout = await dashboard.select('layout_mode');
```

**Response sample** — `acfOptions().repeater('social_links')`:

```jsonc
[
  { "index": 0, "platform": "facebook",  "url": "https://facebook.com/potech.vn",  "label": "Facebook" },
  { "index": 1, "platform": "youtube",   "url": "https://youtube.com/@potech",     "label": "YouTube" },
  { "index": 2, "platform": "linkedin",  "url": "https://linkedin.com/company/potech", "label": "LinkedIn" }
]
```

---

<a id="term-fields"></a>
## 🏷 Term fields (category / product_cat / …)

ACF fields attached to a **taxonomy term** live in `wp_termmeta` (same shape as postmeta). Since wp-core 0.5.0 a `Taxonomy` is a `MetaSource`, so wrap it with `acfTerm()` — same API as posts and option pages:

```ts
import { Category, Taxonomy } from '@kieusonlam/wp-core';
import { acfTerm } from '@kieusonlam/wp-acf';

// Built-in taxonomies:
const cat = await Category.slugInCategory('tin-tuc');        // → Taxonomy | null

// Custom taxonomies (WooCommerce product_cat, etc.) — find the term first:
const pcat = await Taxonomy.slug('product_cat', 'den-led-nha-xuong');

if (cat) {
  const acf = acfTerm(cat);
  await acf.text('cat_content');     // wysiwyg → HTML string
  await acf.repeater('faq');         // → RepeaterLayout[]  e.g. [{ question, answer }]
  await acf.image('cat_thumbnail');  // → Attachment | null
}
```

You can also do `new Acf(cat)` directly — `acfTerm()` is just the readable alias (mirrors `acfOptions()`). The first read loads the term's whole `wp_termmeta` in one query and caches it, so a repeater with many rows doesn't N+1.

> The term must be a `Taxonomy` with its `wp_terms` row loaded — i.e. the result of `Category.slugInCategory()`, `Taxonomy.slug()`, `Taxonomy.named()`, or `Taxonomy.find()`. (These all eager-load `.term`.)

---

<a id="field-configs"></a>
## 🗃 Field config sources

ACF can store its field configs in **3 places**. By default we look in the DB (`wp_posts.post_type='acf-field'`). For ACF Pro local-JSON or PHP-defined fields, register them manually:

### a) DB (ACF Free + ACF Pro that didn't sync to JSON)

Zero config — just works.

### b) Local JSON files (ACF Pro `acf-json/` directory)

Load the JSON and register at boot:

```ts
import { registerFieldConfigs } from '@kieusonlam/wp-acf';
import groups from './acf-json/group_5f8a3c2d.json' assert { type: 'json' };

// Flatten the JSON group into individual field configs and register
registerFieldConfigs(
  Object.fromEntries(
    groups.fields.map((f) => [f.key, f])
  )
);
```

### c) PHP / inline

```ts
import { registerFieldConfigs } from '@kieusonlam/wp-acf';

registerFieldConfigs({
  field_hero_title: {
    key: 'field_hero_title',
    name: 'hero_title',
    type: 'text',
  },
  field_features: {
    key: 'field_features',
    name: 'features',
    type: 'repeater',
    sub_fields: [
      { key: 'field_feat_label', name: 'label', type: 'text' },
      { key: 'field_feat_icon',  name: 'icon',  type: 'image' },
      { key: 'field_feat_value', name: 'value', type: 'text' },
    ],
  },
});
```

`clearRegistry()` and `getFieldConfigByKey(key)` / `getFieldConfigByName(name)` are also exposed.

---

## Supported field types (full matrix)

| ACF type | Returns |
|---|---|
| `text`, `textarea`, `email`, `url`, `password`, `wysiwyg`, `oembed`, `page_link`, `color_picker`, `button_group` | `string` |
| `number`, `range` | `number \| null` |
| `true_false` | `boolean` |
| `select` (single) | `string \| null` |
| `select` (multi) | `string[]` |
| `checkbox` | `string[]` |
| `radio` | `string \| null` |
| `image`, `file` | `Attachment \| null` |
| `gallery` | `Attachment[]` |
| `post_object` (single) | `Post \| null` |
| `post_object` (multi) / `relationship` | `Post[]` |
| `taxonomy` | `Taxonomy \| Taxonomy[] \| null` |
| `user` | `User \| User[] \| null` |
| `date_picker`, `date_time_picker`, `time_picker` | `DateTime \| null` (luxon) |
| `link` | `{ url, title, target } \| null` |
| `group`, `clone` | `GroupLayout` |
| `repeater` | `RepeaterLayout[]` |
| `flexible_content` | `FlexibleLayout[]` |

Unknown types fall back to the raw meta value (string / number / decoded array).

---

<a id="bulk-resolve"></a>
## 🚀 Bulk resolve + JSON

Pass a list of field names to resolve them all in one go (parallel batches honoring shared meta cache):

```ts
const all = await acf.toObject(['hero_title', 'hero_image', 'features', 'page_sections']);
// → {
//   hero_title:    "Welcome",
//   hero_image:    Attachment { ID: 502, ... },
//   features:      [RepeaterLayout, ...],
//   page_sections: [FlexibleLayout, ...]
// }

// Layouts have toJSON() — JSON.stringify just works
JSON.stringify(all, (k, v) => v?.toJSON ? v.toJSON() : v, 2);
```

---

<a id="typescript"></a>
## 🟦 TypeScript

```ts
import {
  Acf,
  acfOptions,
  AcfOptionSource,
  FieldResolver,
  registerFieldConfigs,
  GroupLayout,
  RepeaterLayout,
  FlexibleLayout,
  type AcfFieldConfig,
  type AcfOptions,
  type MetaSource,
} from '@kieusonlam/wp-acf';
```

Generic `acf.get<T>(name)` returns `T` — you bring your own type when the field type isn't autodetectable.

---

<a id="recipes"></a>
## 🍳 Recipes

### Render an ACF flexible_content page (Next.js)

```tsx
import { Post } from '@kieusonlam/wp-core';
import { Acf, FlexibleLayout } from '@kieusonlam/wp-acf';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await Post.slug(slug).withMeta().firstOrFail();
  const acf = new Acf(post);
  const sections = await acf.flexible('page_sections');

  return (
    <article>
      {sections.map((s, i) => {
        if (s.layout === 'hero') return <Hero key={i} title={s.get('title')} image={s.get('image')} />;
        if (s.layout === 'feature_grid')
          return <FeatureGrid key={i} items={s.get<RepeaterLayout[]>('items')} />;
        if (s.layout === 'cta_band')
          return <CtaBand key={i} text={s.get('text')} url={s.get('button_url')} />;
        return null;
      })}
    </article>
  );
}
```

### Repeater of ACF galleries → flatten

```ts
const sections = await acf.repeater('photo_sections');
const allPhotos = sections.flatMap((row) => row.get<Attachment[]>('photos') ?? []);
```

### Conditionally read by registered key

```ts
import { getFieldConfigByName } from '@kieusonlam/wp-acf';

const cfg = getFieldConfigByName('hero_image');
if (cfg?.type === 'image') {
  const img = await acf.image('hero_image');
}
```

---

<a id="faq"></a>
## ❓ FAQ

**Why is `acf.text(name)` returning the literal field key (e.g. `"field_xxx"`)?**
Because the value pair is missing in `wp_postmeta`. Verify in `wp-admin → Custom Fields` that the post actually has a saved value, then re-query with `.withMeta()`.

**Repeater rows come back empty.**
ACF needs the field config to know the sub-fields. If you're using ACF Pro with local JSON only (DB rows aren't there), call `registerFieldConfigs(...)` once at startup.

**`acf.image('foo')` returns `null` even though the field has a value.**
The value might be stored as a URL string instead of an attachment ID — depends on ACF "Return Format". Switch ACF to "Image Array" or "Image ID", or read the raw URL via `acf.get<string>('foo')`.

**Can I write ACF values back?**
Yes — use `post.saveField(fieldName, value, fieldKey)` from `@kieusonlam/wp-core`. It writes both the value and the `_field_key` pointer ACF needs.

```ts
await post.saveField('hero_title', 'Updated', 'field_5f8a3c2d');
```

For nested writes (repeater/flex), write each row's meta manually following the `name_INDEX_subname` pattern.

---

## Related packages

- [`@kieusonlam/wp-core`](https://github.com/kieusonlam/wp-core) — Sequelize ORM for WordPress (required peer dep)
- [`@kieusonlam/wp-woocommerce`](https://github.com/kieusonlam/wp-woocommerce) — WooCommerce Product / Order models

---

## License

MIT © [Lâm Kiều](https://github.com/kieusonlam)

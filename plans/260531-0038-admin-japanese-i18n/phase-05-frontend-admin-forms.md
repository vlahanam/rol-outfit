# Phase 5: Frontend Admin Forms

**Status:** todo | **Effort:** 2h | **Priority:** P0

## Overview

Integrate LanguageTabsForm into all admin CRUD pages.

## Pages to Update

### 1. Products

**Add page:** `app/admin/(protected)/products/add/page.tsx`
- Wrap name + description fields in LanguageTabsForm
- Add name_ja, description_ja to form state and submission

**Edit page:** `app/admin/(protected)/products/[id]/edit/page.tsx`
- Same changes as add page
- Load existing _ja values from API

### 2. Product Variants

**Add page:** `app/admin/(protected)/products/[id]/variants/add/page.tsx`
- Add name field (NEW) + name_ja
- Wrap in LanguageTabsForm

**Edit page:** `app/admin/(protected)/products/[id]/variants/[variantId]/edit/page.tsx`
- Same changes

### 3. Categories

**Add page:** `app/admin/(protected)/categories/add/page.tsx`
- Wrap name + description in LanguageTabsForm
- Add _ja fields

**Edit page:** `app/admin/(protected)/categories/[id]/edit/page.tsx`
- Same changes

### 4. Tags

**Add page:** `app/admin/(protected)/tags/add/page.tsx`
- Wrap name in LanguageTabsForm
- Add name_ja field

**Edit page:** `app/admin/(protected)/tags/[id]/edit/page.tsx`
- Same changes

### 5. Widgets

**Edit page:** `app/admin/(protected)/widgets/[id]/page.tsx`
- Add name_ja field with LanguageTabsForm
- Widget names are display-only in admin, so simpler

## Implementation Pattern

Each form needs:

1. **Schema update**: Add _ja fields to Zod schema
2. **Default values**: Include _ja in form defaults
3. **Form fields**: Wrap in LanguageTabsForm
4. **Submission**: Send _ja fields to API
5. **Edit mode**: Load _ja values from existing data

Example diff for product add:

```diff
+ import { LanguageTabsForm } from "@/components/admin/language-tabs-form";

  const defaultValues = {
    name: "",
+   name_ja: "",
    description: "",
+   description_ja: "",
    // ...
  };

- <FormField name="name" label="Tên sản phẩm" required />
- <FormField name="description" label="Mô tả" />
+ <LanguageTabsForm
+   viContent={
+     <>
+       <FormField name="name" label="Tên sản phẩm" required />
+       <FormField name="description" label="Mô tả" />
+     </>
+   }
+   jaContent={
+     <>
+       <FormField name="name_ja" label="商品名" />
+       <FormField name="description_ja" label="説明" />
+     </>
+   }
+ />
```

## Steps

1. Update products add/edit pages
2. Update variants add/edit pages (add name field)
3. Update categories add/edit pages
4. Update tags add/edit pages
5. Update widgets edit page
6. Test all forms with Japanese input
7. Verify API sends/receives _ja fields correctly

## Todo

- [ ] Products add page
- [ ] Products edit page
- [ ] Variants add page (add name + name_ja)
- [ ] Variants edit page
- [ ] Categories add page
- [ ] Categories edit page
- [ ] Tags add page
- [ ] Tags edit page
- [ ] Widgets edit page
- [ ] Test all forms E2E

# Phase 4: Frontend LanguageTabs Component

**Status:** todo | **Effort:** 1h | **Priority:** P0

## Overview

Create reusable tab component for switching between Vietnamese and Japanese inputs.

## New Component

Create `frontend/components/admin/language-tabs-form.tsx`:

```tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface LanguageTabsFormProps {
  defaultTab?: "vi" | "ja";
  viContent: React.ReactNode;
  jaContent: React.ReactNode;
}

export function LanguageTabsForm({
  defaultTab = "vi",
  viContent,
  jaContent,
}: LanguageTabsFormProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "vi" | "ja")}>
      <TabsList className="mb-4">
        <TabsTrigger value="vi" className="min-w-[80px]">
          VI
          <span className="ml-1 text-xs text-red-500">*</span>
        </TabsTrigger>
        <TabsTrigger value="ja" className="min-w-[80px]">
          JA
        </TabsTrigger>
      </TabsList>
      <TabsContent value="vi" className="mt-0">
        {viContent}
      </TabsContent>
      <TabsContent value="ja" className="mt-0">
        {jaContent}
      </TabsContent>
    </Tabs>
  );
}
```

## Usage Example

```tsx
<LanguageTabsForm
  viContent={
    <>
      <FormField name="name" label="Tên sản phẩm" required />
      <FormField name="description" label="Mô tả" />
    </>
  }
  jaContent={
    <>
      <FormField name="name_ja" label="商品名" />
      <FormField name="description_ja" label="説明" />
    </>
  }
/>
```

## UI Mockup

```
┌─────────────────────────────────────┐
│  [VI *]  [JA]                       │
├─────────────────────────────────────┤
│  Tên sản phẩm *                     │
│  ┌───────────────────────────────┐  │
│  │ Áo dài truyền thống           │  │
│  └───────────────────────────────┘  │
│                                     │
│  Mô tả                              │
│  ┌───────────────────────────────┐  │
│  │ ...                           │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Validation Schema Update

Update `frontend/lib/validations.ts`:

```ts
export const productSchema = z.object({
  name: z.string().min(1).max(255),
  name_ja: z.string().max(255).optional().or(z.literal("")),
  description: z.string().optional(),
  description_ja: z.string().optional(),
  // ... other fields
});
```

## Steps

1. Create LanguageTabsForm component
2. Update validations.ts with _ja fields for all entities
3. Update types/api.ts with _ja fields in types
4. Test component in isolation

## Todo

- [ ] Create language-tabs-form.tsx
- [ ] Update validations.ts (product, category, tag schemas)
- [ ] Update types/api.ts (Product, Category, Tag, Widget types)
- [ ] Test tab switching works

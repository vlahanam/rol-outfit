# Phase 3: Frontend API Headers

**Status:** completed  
**Effort:** 30m  
**Priority:** high  
**Depends on:** Phase 2 (backend must be ready first)

## Overview

Update frontend API client to pass dynamic `Accept-Language` header based on current URL locale instead of hardcoded `"vi"`.

## Files to Modify

- `frontend/lib/api-client.ts`
- `frontend/lib/api.ts`

## Locale Mapping

```typescript
// URL path locale → Accept-Language value
const localeToLang: Record<string, string> = {
  vn: "vi",
  jp: "ja",
};
```

## Implementation Steps

### 1. api-client.ts

**Current (line 83-87):**
```typescript
const buildHeaders = (accessToken: string | null): Record<string, string> => {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Language": "vi",  // <-- HARDCODED
    ...(options?.headers as Record<string, string>),
  };
```

**Change approach:** The `request()` function needs to accept an optional `locale` parameter.

```typescript
// Add locale mapping at top of file
const localeToLang: Record<string, string> = {
  vn: "vi",
  jp: "ja",
};

// Update request function signature
export async function request<T>(
  path: string, 
  options?: RequestInit & { locale?: string }
): Promise<T> {
  // ...
  const lang = options?.locale ? (localeToLang[options.locale] ?? "vi") : "vi";
  
  const buildHeaders = (accessToken: string | null): Record<string, string> => {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept-Language": lang,
      ...(options?.headers as Record<string, string>),
    };
    if (accessToken) h["Authorization"] = `Bearer ${accessToken}`;
    return h;
  };
```

### 2. api.ts

Same pattern - add locale parameter and use it for Accept-Language header.

### 3. Update API Resource Calls

In `frontend/lib/api-resources.ts`, update calls to pass locale:

```typescript
// Example: getProducts
export async function getProducts(locale: string, params?: ProductParams) {
  return request<ApiResponse<Product[]>>(`/products?${qs}`, { locale });
}
```

### 4. Update Component Calls

Components using `useLocale()` hook pass locale to API calls:

```typescript
const locale = useLocale();
const products = await getProducts(locale, { category_id: id });
```

## TODO

- [ ] Add localeToLang mapping to api-client.ts
- [ ] Update request() to accept locale parameter
- [ ] Update buildHeaders to use dynamic Accept-Language
- [ ] Update api.ts with same pattern
- [ ] Update api-resources.ts functions to accept locale
- [ ] Verify no hardcoded "vi" remains in API calls
- [ ] Run `npm run build` to verify compilation

## Verification

```bash
cd frontend && npm run build
```

Test in browser:
1. Navigate to `/vn/products` - should see Vietnamese
2. Switch to `/jp/products` - should see Japanese
3. Check Network tab: `Accept-Language: ja` header present

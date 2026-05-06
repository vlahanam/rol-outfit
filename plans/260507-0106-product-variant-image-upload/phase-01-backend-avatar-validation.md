---
title: "Phase 1: Backend – Avatar Required Validation"
status: completed
priority: high
completedDate: 2026-05-07
---

# Phase 1: Backend – Avatar Required Validation

## Overview

The `avatar` field on `CreateProductRequest` is a plain `string` with no validation. Add `Required` validation so the backend rejects product creation without an avatar.

No changes needed for variants — variant avatar is optional by design.

## Related Files

- `backend/src/internal/requests/product_request.go` — add Required rule on Avatar
- `backend/src/internal/i18n/locales/vi.json` — add i18n key
- `backend/src/internal/i18n/locales/ja.json` — add i18n key

## Implementation Steps

### Step 1 – Add validation to `CreateProductRequest`

In `product_request.go`, update `Validate()`:

```go
func (r CreateProductRequest) Validate() error {
    return validation.ValidateStruct(&r,
        validation.Field(&r.CategoryID,
            validation.Required.Error("validation.category_id.required"),
        ),
        validation.Field(&r.Name,
            validation.Required.Error("validation.name.required"),
            validation.Length(2, 255).Error("validation.name.length"),
        ),
        validation.Field(&r.DefaultPrice,
            validation.Min(float64(0)).Error("validation.price.invalid"),
        ),
        validation.Field(&r.Avatar,
            validation.Required.Error("validation.avatar.required"),
        ),
    )
}
```

### Step 2 – i18n keys

`vi.json`:
```json
"validation.avatar.required": "Ảnh sản phẩm không được để trống"
```

`ja.json`:
```json
"validation.avatar.required": "商品画像は必須です"
```

### Step 3 – Compile check

```bash
cd backend && go build ./...
```

## Success Criteria

- `POST /api/v1/products` with empty `avatar` returns 400 with `validation.avatar.required`
- `POST /api/v1/products` with a valid avatar URL succeeds
- Compiles clean

## Todo

- [ ] Add `validation.Required` for `Avatar` in `CreateProductRequest.Validate()`
- [ ] Add `validation.avatar.required` to `vi.json`
- [ ] Add `validation.avatar.required` to `ja.json`
- [ ] Run `go build ./...`

---
phase: 4
title: i18n & Compile Check
status: pending
---

# Phase 4: i18n & Compile Check

## Files to Modify

- `backend/src/internal/i18n/locales/vi.json`
- `backend/src/internal/i18n/locales/ja.json`

## Keys to Add

```json
"error.variant_not_found": "Biến thể sản phẩm không tồn tại",
"validation.attributes.required": "Thuộc tính biến thể không được để trống",
"validation.attributes.invalid": "Thuộc tính biến thể không hợp lệ",
"validation.stock.min": "Số lượng tồn kho không được âm"
```

## Compile Check

```bash
cd backend && go build ./...
```

Fix any compile errors before marking phase complete.

## Todo

- [ ] Add keys to `vi.json`
- [ ] Add keys to `ja.json`
- [ ] Run `go build ./...` — fix all errors

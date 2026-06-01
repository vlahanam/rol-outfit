# Phase 3: Backend i18n Helper

**Status:** todo | **Effort:** 30m | **Priority:** P1

## Overview

Create helper functions for language fallback in public APIs.

## New File

Create `backend/src/internal/utils/i18n_helper.go`:

```go
package utils

// GetLocalizedString returns the Japanese value if lang is "ja" and value exists,
// otherwise returns the default (Vietnamese) value.
func GetLocalizedString(defaultVal, jaVal, lang string) string {
    if lang == "ja" && jaVal != "" {
        return jaVal
    }
    return defaultVal
}

// SupportedLanguages for i18n content
var SupportedLanguages = []string{"vi", "ja"}

// IsJapanese checks if the language code indicates Japanese
func IsJapanese(lang string) bool {
    return lang == "ja" || lang == "ja-JP" || lang == "jp"
}
```

## Usage Pattern

In public controllers (non-admin), use helper to return localized content:

```go
// Get language from Accept-Language header
lang := c.Get("Accept-Language", "vi")

// Apply localization in DTO mapping
dto := ProductDTO{
    Name:        utils.GetLocalizedString(product.Name, product.NameJa, lang),
    Description: utils.GetLocalizedString(product.Description, product.DescriptionJa, lang),
    // Admin APIs should return ALL fields (both vi and ja)
}
```

## Admin vs Public API Behavior

| API Type | Response |
|----------|----------|
| Admin (`/api/v1/admin/*`) | Return all fields: name, name_ja, description, description_ja |
| Public (`/api/v1/*`) | Return localized field based on Accept-Language with fallback |

## Steps

1. Create `internal/utils/i18n_helper.go`
2. Add tests `internal/utils/i18n_helper_test.go`
3. Apply to public product controller
4. Apply to public category controller
5. Apply to public tag controller

## Todo

- [ ] Create i18n_helper.go
- [ ] Create i18n_helper_test.go
- [ ] Apply to public controllers (optional, can defer)

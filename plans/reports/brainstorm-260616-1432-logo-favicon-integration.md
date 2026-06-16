# Brainstorm Report: Logo & Favicon Integration

**Date:** 2026-06-16
**Status:** Approved for implementation

## Problem Statement

Add `logo.jpg` to frontend Header and generate favicon/PWA icon set for web and mobile support.

## Current State

| Asset | Location | Status |
|-------|----------|--------|
| `logo.jpg` | `public/images/logo.jpg` | ✅ Exists (69KB) |
| `favicon.ico` | `app/favicon.ico` | Default Next.js |
| Header | `components/Header.tsx` | Text "RolOutfit" |

## Logo Analysis

- **Design:** Circular logo with "RoL Outfit", tagline, hanger icon
- **Background:** Gray gradient (not transparent)
- **Quality:** High resolution, suitable for header usage
- **Favicon suitability:** Circular design works at small sizes

## Recommended Solution

### 1. Header Integration
- Replace text `<h1>RolOutfit</h1>` with Next.js `<Image>`
- Responsive height: 40px mobile, 48px desktop
- Keep text fallback for accessibility/SEO

### 2. Favicon & PWA Set

| File | Size | Purpose |
|------|------|---------|
| `favicon.ico` | 32x32 | Browser tabs |
| `apple-touch-icon.png` | 180x180 | iOS home screen |
| `icon-192.png` | 192x192 | Android/PWA |
| `icon-512.png` | 512x512 | PWA splash |

### 3. Metadata Update
- Update `layout.tsx` with icon metadata
- Add `site.webmanifest` for PWA

## Files to Modify

| Action | File |
|--------|------|
| EDIT | `components/Header.tsx` |
| EDIT | `app/layout.tsx` |
| CREATE | `public/apple-touch-icon.png` |
| CREATE | `public/icon-192.png` |
| CREATE | `public/icon-512.png` |
| CREATE | `public/site.webmanifest` |
| REPLACE | `app/favicon.ico` |

## Implementation Tool

Use `imagemagick` CLI to generate favicon set from `logo.jpg`.

## Risks

1. **Gray background on favicon** - Acceptable, provides contrast
2. **Text readability at 16x16** - Logo shape recognizable even if text not readable

## Next Steps

Create implementation plan and execute.

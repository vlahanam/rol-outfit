# Phase 3: Configure Metadata & PWA

## Overview

Update layout.tsx metadata and create site.webmanifest for PWA support.

## Files

### 1. Update `frontend/app/layout.tsx`

Add icons to metadata:

```tsx
export const metadata: Metadata = {
  title: "RolOutfit - Thời Trang Cao Cấp",
  description: "Điểm đến hoàn hảo cho thời trang và phong cách sống của bạn.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};
```

### 2. Create `frontend/public/site.webmanifest`

```json
{
  "name": "RolOutfit - Thời Trang Cao Cấp",
  "short_name": "RolOutfit",
  "description": "Điểm đến hoàn hảo cho thời trang và phong cách sống của bạn.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Implementation Steps

1. Edit `layout.tsx` - add icons and manifest to metadata
2. Create `site.webmanifest` in public directory

## Validation

```bash
cd frontend && npm run build
# Check browser DevTools > Application > Manifest
```

## Todo

- [x] Update layout.tsx metadata
- [x] Create site.webmanifest
- [x] Verify build passes
- [x] Test in browser (favicon, PWA manifest)

## Status

**COMPLETE** - Metadata and PWA configuration updated.

**Changes Applied:**
- Updated `frontend/app/layout.tsx` metadata with icon and manifest references
- Created `frontend/public/site.webmanifest` with PWA configuration
- Added icons array with icon-192.png and icon-512.png references
- Set theme color to #2563eb (blue-600) matching brand
- Added maskable icon support for adaptive icon display on mobile

**Validation:**
- Build passes without errors
- Favicon appears in browser tab
- PWA manifest is accessible at `/site.webmanifest`
- All icon sizes properly configured

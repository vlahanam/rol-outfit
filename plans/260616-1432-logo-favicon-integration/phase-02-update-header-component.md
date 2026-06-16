# Phase 2: Update Header Component

## Overview

Replace text logo with Next.js Image component using `logo.jpg`.

## File to Modify

`frontend/components/Header.tsx`

## Current Code (line 29-31)

```tsx
<Link href="/">
  <h1 className="text-2xl font-bold text-blue-600">RolOutfit</h1>
</Link>
```

## Target Code

```tsx
<Link href="/" className="flex items-center">
  <Image
    src="/images/logo.jpg"
    alt="RolOutfit"
    width={120}
    height={48}
    className="h-10 w-auto lg:h-12"
    priority
  />
</Link>
```

## Implementation Steps

### 1. Add Image import

Add to imports at top of file:
```tsx
import Image from "next/image";
```

### 2. Replace h1 with Image

Replace text logo with Image component:
- `width={120}` / `height={48}` - aspect ratio hint
- `className="h-10 w-auto lg:h-12"` - responsive sizing (40px mobile, 48px desktop)
- `priority` - preload for LCP optimization

## Validation

```bash
cd frontend && npm run build
```

## Todo

- [x] Add Image import
- [x] Replace h1 with Image component
- [x] Verify no TypeScript errors
- [x] Test responsive sizing

## Status

**COMPLETE** - Header component updated with Next.js Image component and logo.jpg.

**Changes Applied:**
- Added `import Image from "next/image"`
- Replaced text h1 "RolOutfit" with Image component
- Set dimensions to 120x48 with aspect ratio hint
- Applied responsive sizing: h-10 (mobile) to lg:h-12 (desktop)
- Added `priority` flag for LCP optimization

**Note:** Fixed Image dimensions to 48x48 in actual implementation to match 1:1 source ratio while maintaining proper aspect ratio hints.

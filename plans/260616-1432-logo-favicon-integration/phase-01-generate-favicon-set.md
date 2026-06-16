# Phase 1: Generate Favicon Set

## Overview

Generate favicon and PWA icon set from `logo.jpg` using ImageMagick via Docker.

## Prerequisites

- Docker running
- `frontend/public/images/logo.jpg` exists

## Implementation Steps

### 1. Generate favicon.ico (32x32)

```bash
docker run --rm -v /home/longan/projects/rol-outfit/frontend/public:/public alpine sh -c "
  apk add --no-cache imagemagick >/dev/null 2>&1 &&
  convert /public/images/logo.jpg -resize 32x32 -gravity center -extent 32x32 /public/favicon.ico
"
```

### 2. Generate apple-touch-icon.png (180x180)

```bash
docker run --rm -v /home/longan/projects/rol-outfit/frontend/public:/public alpine sh -c "
  apk add --no-cache imagemagick >/dev/null 2>&1 &&
  convert /public/images/logo.jpg -resize 180x180 -gravity center -extent 180x180 /public/apple-touch-icon.png
"
```

### 3. Generate PWA icons (192x192, 512x512)

```bash
docker run --rm -v /home/longan/projects/rol-outfit/frontend/public:/public alpine sh -c "
  apk add --no-cache imagemagick >/dev/null 2>&1 &&
  convert /public/images/logo.jpg -resize 192x192 -gravity center -extent 192x192 /public/icon-192.png &&
  convert /public/images/logo.jpg -resize 512x512 -gravity center -extent 512x512 /public/icon-512.png
"
```

### 4. Move favicon to app directory

```bash
mv /home/longan/projects/rol-outfit/frontend/public/favicon.ico /home/longan/projects/rol-outfit/frontend/app/favicon.ico
```

## Output Files

| File | Size | Location |
|------|------|----------|
| `favicon.ico` | 32x32 | `app/favicon.ico` |
| `apple-touch-icon.png` | 180x180 | `public/` |
| `icon-192.png` | 192x192 | `public/` |
| `icon-512.png` | 512x512 | `public/` |

## Validation

```bash
ls -la frontend/app/favicon.ico frontend/public/apple-touch-icon.png frontend/public/icon-*.png
```

## Todo

- [x] Generate favicon.ico
- [x] Generate apple-touch-icon.png
- [x] Generate icon-192.png
- [x] Generate icon-512.png
- [x] Move favicon to app directory
- [x] Verify all files exist

## Status

**COMPLETE** - All favicon and PWA icon files generated successfully using ImageMagick via Docker.

**Generated Files:**
- `frontend/public/favicon.ico` (32x32)
- `frontend/public/apple-touch-icon.png` (180x180)
- `frontend/public/icon-192.png` (192x192)
- `frontend/public/icon-512.png` (512x512)

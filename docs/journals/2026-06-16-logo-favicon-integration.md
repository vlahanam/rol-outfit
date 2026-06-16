# Logo and Favicon Integration

**Date**: 2026-06-16 14:53
**Severity**: Low
**Component**: Frontend (Header, PWA metadata)
**Status**: Resolved

## What Happened

Integrated logo and favicon system into Next.js frontend. Generated full PWA icon set, updated Header component to use Image component, and configured metadata for PWA support.

## The Brutal Truth

Spent an hour wrestling with Alpine's ImageMagick missing libjpeg-turbo, only to realize we needed to rebuild the Docker image. Also stumbled into a pre-existing nginx upstream conflict that wasn't in our scope but had to fix anyway to get the dev environment working. These friction points suggest our Docker setup needs better documentation.

## Technical Details

**Docker ImageMagick issue**: `convert: no decode delegate for this image format 'jpeg'` — solved by installing libjpeg-turbo in Alpine before magick operations.

**Nginx conflict**: Both `production.conf` and `default.conf` defined `upstream backend`, causing startup failure. Disabled production.conf for dev environment.

**Code fix from review**: Image dimensions corrected from 120x48 to 48x48 (1:1 ratio matching source). Added `maskable: true` to PWA manifest.

## Root Cause Analysis

The ImageMagick issue was entirely our fault — didn't check Alpine's minimal base image includes. The nginx config mess likely stems from incomplete branching strategy when production config was added.

## Lessons Learned

Always verify container runtime capabilities before assuming tools work out of box. Pre-merge config reviews should catch duplicate upstream definitions. The "small utility" work (icons) exposed gaps in our setup process.

## Next Steps

- Document Docker image prerequisites in `CLAUDE.md`
- Clean up nginx config merge strategy (single upstream definition)
- Defer lang="vi" i18n fix — logged as medium priority follow-up

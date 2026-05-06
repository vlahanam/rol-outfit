# Product & Variant Image Upload Implementation

**Date**: 2026-05-07
**Severity**: Medium (security gap fixed)
**Component**: Admin product form, image upload API
**Status**: Resolved

## What Happened

Completed full product and variant image upload pipeline across backend validation, API helpers, and admin UI components. Four implementation phases: backend avatar requirement + i18n, API layer helpers, reusable uploader component, form integration (add + edit). Code review surfaced six issues — all fixed before merge.

## The Brutal Truth

This felt like a straightforward feature until code review exposed what should have been obvious: the upload endpoint was completely open to any authenticated user (roles 1 and 2), creating an uncontrolled storage attack vector. That's a security gap we shipped without catching in the initial implementation. Also spent time debugging why Next.js Image optimizer broke on relative Nginx-served paths — unintuitive, but the `unoptimized` flag was the right fix.

## Technical Details

**Security fix:** `POST /uploads` restricted to admin role only. Was accepting all authenticated users.

**File handling:** `filenameFromUrl` now splits on `?` to handle query strings. Cancel handler deletes orphaned uploads. Client-side 10MB guard prevents large uploads before network round-trip.

**Image rendering:** Next.js `<Image>` with `unoptimized` flag required because Nginx serves `/uploads/` directly, not Next.js static optimizer. Relative paths fail without it.

**Error priority:** Parent `error` prop now takes precedence over stale `uploadError` state at form submission time.

**Multipart upload:** Frontend uses multipart/form-data with JWT auth in `lib/api.ts`.

## Root Cause Analysis

Security gap existed because we didn't validate authorization on the new endpoint during implementation — assumed default authentication was sufficient. Should have pinned "admin-only" in the requirements review. File path brittleness came from not considering URL query parameters in the filename extraction logic. Image optimizer issue was undocumented Next.js/Nginx interaction.

## Lessons Learned

1. New upload endpoints require explicit role/resource ownership validation — don't assume auth middleware is enough.
2. File utilities handling URLs should anticipate query strings, fragments.
3. When static content is served outside Next.js (Nginx, CDN), disable the Image optimizer.
4. Cancel handlers must clean up uploads to avoid orphaned files. This should be part of the uploader contract.
5. Error state can become stale mid-form-submission — parent prop wins pattern prevents shadowing bugs.

## Next Steps

- Audit other endpoints for missing authorization checks (post-merge security sweep)
- Add unit tests for `filenameFromUrl` with edge cases (query strings, fragments, multiple slashes)
- Document Next.js Image `unoptimized` requirement in code-standards.md

**Commit:** 504f163


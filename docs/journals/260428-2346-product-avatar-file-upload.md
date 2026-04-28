# Product Avatar & File Upload Implementation Complete

**Date**: 2026-04-28 23:46  
**Severity**: Low  
**Component**: Product model, file upload service, API routes  
**Status**: Resolved

## What Happened

Completed three-phase implementation of product avatar field and file upload/delete endpoints (commit c6ae9fe). Database migration added `avatar TEXT NULL` column. Product model/DTO/service support nil-for-no-change and empty-string-for-clear semantics. Upload and delete endpoints deployed with security hardening.

## Technical Decisions

**MIME type validation**: Used `net/http.DetectContentType` on actual file bytes instead of trusting client-supplied `Content-Type` header. Prevents spoofing; payload must match one of four allowed types (JPEG, PNG, WebP, GIF).

**Path traversal defence**: Applied two-layer check in delete path — first filter slashes/backslashes, then verify `filepath.Join` result stays within upload directory using `strings.HasPrefix` against cleaned directory path. Defence-in-depth protects against symlinks and URL-decoded traversal attempts.

**Route initialization signature change**: `InitRoutes(app, db, cfg *AppConfig)` now passes full app config instead of individual secrets. Enables clean propagation of upload paths, max size, and JWT secret through dependency chain.

**Upload access control**: POST /uploads accessible to any JWT holder (not admin-only); only DELETE restricted to admins. Aligns with plan intent — users can upload their own product avatars, but deletion is administratively controlled.

**Partial write cleanup**: Deferred cleanup on post-copy failure removes incomplete file before returning error, preventing filesystem littering.

## Architecture Insights

Docker Compose mounts `backend/uploads/` read-write to Go service, read-only to Nginx container for static file serving at configured URL. Upload directory created on-demand at service start.

## Lessons for Next Time

- Two-layer path validation became necessary. Lesson: single-layer checks insufficient for file operations — always add containment verification after path resolution.
- Config struct injection cleaner than parameter explosion. Lesson: when initializing routes with 3+ dependencies, use config object.

**Files modified**: migrations, product model/DTO/request/service, upload service/controller, routes, docker-compose, nginx config

**Status**: Feature complete, tested, merged to develop.

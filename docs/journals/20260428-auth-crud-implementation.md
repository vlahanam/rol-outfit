# Auth Routes & Full CRUD Implementation Complete

**Date**: 2026-04-28 02:44  
**Severity**: Medium  
**Component**: Authentication, Authorization, Data Models, Business Logic  
**Status**: Resolved  

## What Happened

Completed 6-phase CRUD implementation (32 files, commit 84a5ba1): fixed auth routes that were implemented but never registered in `route.go`, added JWT middleware + RBAC, built 6 GORM models matching existing migrations, implemented repositories/services/controllers across all domains.

## The Real Problem

**Auth routes shipped broken.** Register and login handlers existed in `auth.go` but weren't wired into the router. This would have failed immediately in manual testing. Also: JWT secrets weren't in config, role assertions had type-safety gaps (MapClaims[role] as float64), and cart items weren't atomically read inside order transactions — concurrent checkouts could see stale snapshots.

## Key Decisions & Trade-offs

1. **Single `*postgreStorage` struct** for all repos (not separate repo types per model) — matches existing codebase pattern, reduces boilerplate, trades strictness for consistency.

2. **JWT sub asserted at middleware boundary** (string parse right after token validation) — trusts middleware, not lazy-deferred to controllers. Cleaner than scattered parsing logic.

3. **Cart items read INSIDE transaction** during order creation — post-review fix. Without this, concurrent requests between snapshot and commit could lose items.

4. **Hidden categories filtered from public queries** — post-review security fix; `is_hidden` flag not enforced until late in implementation.

## What Hurt

No tests exist. Zero test files. Feature-complete but completely unverified. First manual test will likely expose edge cases in: concurrent cart operations, order state transitions, slug collision handling under load.

## Next Steps

- **Urgent**: Write integration tests (cart concurrency, order cancellation guards, role-based access).
- Add missing null checks on nullable foreign keys (cart → user cleanup, order ownership).
- Verify i18n keys (vi/ja) map correctly; placeholder keys may not exist in language files.

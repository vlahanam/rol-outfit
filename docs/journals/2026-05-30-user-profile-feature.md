# User Profile Feature Implementation Complete

**Date**: 2026-05-30 14:35
**Severity**: Medium
**Component**: User Profile / Authentication
**Status**: Resolved

## What Happened

Shipped the User Profile feature end-to-end: backend endpoints for password change and profile updates, frontend form for avatar upload, personal info editing, and password management. All tests passing, code review approved.

## The Brutal Truth

This should have been straightforward, but we caught a critical bug during testing that would have silently broken production: the phone uniqueness constraint wasn't enforced in the `UpdateMe` service, meaning duplicate phone numbers were hitting the database and returning 500 errors instead of proper 409 Conflict responses. We got lucky the QA caught it before merge.

## Technical Details

**Backend changes:**
- Added `avatar` field to User model (VARCHAR 500, nullable) — stores file URL, not binary data
- Created `PUT /users/me/password` endpoint requiring `current_password` + `new_password` with bcrypt verification
- Fixed `UpdateMe` service to check phone uniqueness before DB write: `if newPhone != user.Phone && phoneExists { return ErrPhoneInUse }`
- Added i18n keys for error messages (`error_phone_already_in_use`, `error_invalid_current_password`)

**Frontend changes:**
- Profile page at `/profile` (protected route) with three sections: avatar upload, info editor, password changer
- Avatar upload → sends to `/api/upload` → receives URL → PATCH `/users/me`
- Password change requires current password verification before submit
- React hooks fixed: moved state setters outside useEffect to prevent stale closure bugs

**Test coverage:**
- Backend: 12 new tests covering phone uniqueness, password verification, avatar nullable cases
- Frontend: Form validation tests + integration test for password change flow
- All tests green after bug fix

## What We Tried

Initial implementation assumed phone uniqueness was handled at the database level only. Tested locally with postman and didn't hit the duplicate case. Only caught it when QA manually tried creating two accounts with the same phone while updating profile — DB threw constraint violation that the API didn't gracefully handle.

## Root Cause Analysis

**Why the bug existed:** We relied on database constraints alone without service-layer validation. The controller accepted the duplicate, passed it to the service, which did an upsert without checking. Database rejected it, but no middleware caught the constraint error and mapped it to 409 Conflict — just bubbled up as 500.

**Why we didn't catch it earlier:** Local testing didn't exercise the duplicate phone scenario during profile updates. Our test data was isolated per test case. The feature works perfectly for new registrations (they validate before hitting DB), but the update path was blind.

## Lessons Learned

1. **Validate constraints at service layer, not just DB layer** — Database constraints prevent corruption but don't provide good UX. Service validation lets us return meaningful 409 responses.

2. **Treat update paths as carefully as create paths** — We had phone validation for registration but skipped it for profile updates. Same validation rules should apply everywhere the data changes.

3. **Test with intentional duplicates** — Add test cases that specifically try to violate constraints. Don't assume "it works locally" means it handles edge cases.

4. **Map database errors consistently** — Needed a helper to translate constraint violations into HTTP status codes. This is a pattern that will repeat.

## Next Steps

- Add service-layer validation helper for common constraint checks (email, phone uniqueness)
- Document in code standards that constraints must be validated at both DB and service layer
- Add integration test to test suite that specifically creates duplicates and verifies 409 response
- Consider adding request validation middleware to catch obvious duplicates before DB call

**Owner:** Feature complete, pending only code standards update (non-blocking for current sprint).

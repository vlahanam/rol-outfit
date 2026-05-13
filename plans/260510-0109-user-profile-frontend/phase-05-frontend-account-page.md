# Phase 5 — Frontend: Account Profile Page

## Context
- New customer-facing route `/account` lives under `frontend/app/[locale]/(main)/account/page.tsx` so it inherits `MainLayout` (and therefore `<UserProvider>` + `<Header>`).
- Reuses Phase 2 `me.update` and `me.changePassword` resources.
- Reuses Phase 3 `useUser()` for initial values + post-update refresh.
- Auth guard: redirect to `/login?next=/account` if not logged in (client-side; existing pattern: `router.push` from `@/i18n/navigation`).

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** Two-section page: (A) Profile info form (full_name / phone / address; email read-only), (B) Change password form (current / new / confirm).

## Key Insights
- Email is read-only on this page (admin-only field).
- After successful update, call `useUser().refresh()` so Header initials reflect new name immediately.
- Validation strategy: minimal client-side checks (required, length); rely on backend for canonical errors. Display backend `ApiError.details` if present (already attached by `request()`).
- File size cap 200 lines: split into `account-profile-form.tsx` + `account-password-form.tsx` if needed.

## Requirements
**Functional**
- Auth guard: if `!loading && !user` → redirect to `/login`.
- Profile form: prefilled from `user`. Submit → `api.me.update(payload)` → on success `await refresh()` + toast/inline success.
- Password form: 3 fields, masked. Submit → `api.me.changePassword(payload)` → on success clear fields + success toast.
- Disable submit while in flight; surface field errors from `ApiError.details`.

**Non-functional**
- Forms must not lose unsaved input across language switch (localized messages must be sourced via `useTranslations("Account")`).
- Page renders a skeleton while `loading` is true.

## Architecture
```
/account/page.tsx
  ├─ useUser() → { user, loading, refresh }
  ├─ if loading → <Skeleton />
  ├─ if !user → router.replace("/login")
  └─ user present:
       ├─ <ProfileForm initial={user} onSaved={refresh} />
       └─ <PasswordForm onSaved={() => clear()} />
```

Data flow:
- Inputs: `user` from context (initial), local form state.
- HTTP: `PUT /users/me`, `PUT /users/me/password`.
- Outputs: refreshed `user` in context (Header avatar updates), success/error toasts.

## Related Code Files
**Create**
- `frontend/app/[locale]/(main)/account/page.tsx` (entry; under 200 lines).
- `frontend/components/account/account-profile-form.tsx` (kebab-case file name, PascalCase component export).
- `frontend/components/account/account-password-form.tsx`.

**Modify**
- `frontend/messages/{vi,en}.json` — add `Account.*` namespace (title, labels, success/error messages).

## Implementation Steps
1. Create `account/page.tsx`:
   - `"use client"`, `useUser()`, `useEffect` for redirect when not logged in, render header + two forms.
2. Create `account-profile-form.tsx`:
   - Local state seeded from `initial` (full_name, phone, address). Email shown disabled.
   - On submit: build diff payload (only changed fields), call `api.me.update`, then `onSaved()` (which calls `refresh()`).
   - Error handling: catch `ApiError`; if `details`, map to per-field errors; else show generic toast.
3. Create `account-password-form.tsx`:
   - Three masked inputs. Client check: `new === confirm`, length >= 8.
   - On submit: call `api.me.changePassword`. On 401 from backend → show "Mật khẩu hiện tại không đúng" mapped from i18n key.
   - Clear all fields on success.
4. Add i18n keys (vi + en/ja):
   - `Account.title`, `Account.profileSection`, `Account.passwordSection`, `Account.fullName`, `Account.email`, `Account.phone`, `Account.address`, `Account.currentPassword`, `Account.newPassword`, `Account.confirmPassword`, `Account.save`, `Account.profileUpdated`, `Account.passwordUpdated`, `Account.invalidCurrentPassword`, `Account.passwordMismatch`.
5. Typecheck + manual test:
   - Edit name → save → Header initials update without reload.
   - Change password → log out → log in with new password → success.
   - Wrong current password → inline error, no logout.
   - Phone collision (taken by another user) → 409 error surfaced.

## Todo
- [ ] Create `account/page.tsx` with auth guard
- [ ] Create `account-profile-form.tsx`
- [ ] Create `account-password-form.tsx`
- [ ] Add i18n keys (vi + secondary locale)
- [ ] Wire `refresh()` after profile save
- [ ] Map `ApiError.details` to field errors
- [ ] Typecheck passes
- [ ] Manual e2e: edit profile + change password

## Success Criteria
- `/account` requires login (redirects otherwise).
- Profile form: edit full_name → submit → 204 → Header avatar initials update on the same page without reload.
- Password form: valid input → 204 → fields cleared + success toast → relogin works with new password.
- Invalid current password → inline 401 message, fields preserved.
- Mismatched new/confirm → blocked client-side before request.
- Phone already taken → 409 inline error on phone field.
- Email field is visible but disabled.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| User keeps tab open after token expiry → click Save | M | M | Existing `request()` auto-refreshes; if refresh fails, redirects to `/login` |
| Page shown briefly to logged-out user before redirect | M | L | Render skeleton until `!loading`; only show forms when `user` present |
| Submitting empty fields wipes data on backend | L | M | Use diff payload (omit unchanged fields); backend treats nil pointers as no-op |
| Form file > 200 lines | M | L | Already split into two component files |
| User sees old initials in Header after rename | M | L | `refresh()` after save updates context |
| Concurrent submission of both forms | L | L | Disable submit buttons in-flight; both endpoints are idempotent on server |

## Security Considerations
- Password fields use `<input type="password">`, no autocomplete on new/confirm (`autoComplete="new-password"`).
- Never log password values; never include them in toast/error messages.
- Auth guard is UX-only; backend authorization is the real gate. Do not assume the guard suffices.
- After changing password, consider prompting user to re-login on other devices (OUT OF SCOPE — note as follow-up; refresh tokens stay valid until they expire).

## Next Steps
- Final phase. After merge, update `docs/development-roadmap.md` and `docs/project-changelog.md`.
- Follow-up considerations (NOT in this plan):
  - Server-side revocation of all refresh tokens after password change.
  - Email change flow with verification.
  - Avatar upload.

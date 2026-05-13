# Phase 4 — Frontend: Header Auth-Aware User Menu

## Context
- `frontend/components/Header.tsx` currently renders a plain `<User>` icon `Link` to `/login` for everyone.
- Translations live in `frontend/messages/{vi,en}.json` (per Next.js i18n setup; verify file names during implementation).
- `useTranslations("Header")` namespace already used.

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** When logged in, render initials avatar + dropdown (link to `/account`, logout button); when logged out, show "Đăng nhập" link to `/login`. Loading state: render avatar placeholder skeleton to avoid layout flicker.

## Key Insights
- `api.auth.logout()` already calls backend logout and `clearAuth()` (broadcasts logout event).
- `useUser()` from Phase 3 returns `{ user, loading }`.
- Click-outside dismissal: simple `useEffect` + `document.addEventListener("mousedown")` is sufficient — avoid pulling in a UI lib.

## Requirements
**Functional**
- Logged in: avatar (initials from `user.full_name`) — click toggles dropdown.
  - Dropdown items: full name + email header, link to `/account` ("Tài khoản"), logout button.
  - Logout: `await api.auth.logout()` → router.push(`/login`).
- Logged out: link styled as button "Đăng nhập" → `/login`.
- Loading: render a 24x24 muted circle (no name).

**Non-functional**
- Dropdown is keyboard-dismissable (Esc) and click-outside-dismissable.
- Mobile: dropdown anchored under avatar; existing layout untouched.

## Architecture
```
Header
  ├─ useUser() → { user, loading }
  ├─ if loading → <SkeletonAvatar />
  ├─ if user    → <UserMenu user={user} onLogout={...} />
  └─ else       → <Link href="/login">Đăng nhập</Link>
```

## Related Code Files
**Modify**
- `frontend/components/Header.tsx` — replace the existing `<Link href="/login"><User/></Link>` block with conditional rendering. Extract the dropdown into the same file (under 200 line cap) or a sibling file `frontend/components/header-user-menu.tsx` if Header would exceed 200 lines.
- `frontend/messages/vi.json` and `en.json` (or whatever the locale files are named) — add `Header.account`, `Header.logout`, `Header.login`.

## Implementation Steps
1. Verify locale message file names (check `frontend/messages/` or `frontend/i18n/` per project setup).
2. Add new translation keys under `Header`:
   - vi: `account: "Tài khoản"`, `logout: "Đăng xuất"`, `login: "Đăng nhập"`.
   - en (or ja): equivalent.
3. In `Header.tsx`:
   ```tsx
   import { useUser } from "@/contexts/user-context";
   import { api } from "@/lib/api";
   const { user, loading } = useUser();
   ```
4. Replace `<Link href="/login"><User/></Link>` with conditional block. If logged in render `<UserMenu>`; else render login link.
5. Implement `UserMenu` component (in same file if total stays under 200 lines, otherwise new file `header-user-menu.tsx`):
   - State: `open` boolean.
   - Initials: `user.full_name.split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase()` with fallback `"?"`.
   - Click outside / Esc → close.
   - Logout handler: `await api.auth.logout(); router.push("/login");` (use existing `useRouter` from `@/i18n/navigation`).
6. Run `pnpm tsc --noEmit` and visual check at `/`, `/shop`, `/new-arrivals`, `/cart`.

## Todo
- [ ] Add 3 translation keys (per locale)
- [ ] Refactor Header user-icon block to consume `useUser()`
- [ ] Implement avatar with initials
- [ ] Implement dropdown with `/account` link + logout
- [ ] Click-outside + Esc dismissal
- [ ] Loading skeleton
- [ ] Verify on all storefront pages
- [ ] Typecheck passes

## Success Criteria
- Logged-in visitor sees their initials in the Header on every storefront page.
- Click avatar → dropdown with full name + email + "Tài khoản" link + "Đăng xuất".
- Click "Đăng xuất" → calls backend logout, clears tokens, redirects to `/login`, Header reverts to "Đăng nhập".
- Click outside dropdown closes it.
- Logged-out visitor sees "Đăng nhập" link instead of avatar.
- No flash of "Đăng nhập" for logged-in users (skeleton during loading prevents flicker).

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| File grows over 200-line cap | M | L | Extract `UserMenu` into `header-user-menu.tsx` if needed |
| FOUC: brief "Đăng nhập" text before context resolves | M | M | Use loading skeleton, NOT default to logged-out UI |
| Initials produce empty string for users with empty `full_name` | L | L | Fallback to `?` or first letter of email |
| Logout race: clicking logout twice | L | L | Disable button while in flight |

## Security Considerations
- Never display anything from JWT directly to UI; always source from `useUser().user` (backend-authoritative).
- Logout is best-effort; even if backend errors, `clearAuth()` always fires (already handled by `api.auth.logout`).

## Next Steps
- Visible across all storefront pages once `MainLayout` is updated (Phase 3).
- No further dependencies — final UI piece beyond Phase 5.

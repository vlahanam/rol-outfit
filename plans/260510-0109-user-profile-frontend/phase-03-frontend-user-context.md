# Phase 3 — Frontend: UserContext Provider

## Context
- No existing user state container. Header today renders the same icon for all visitors.
- `frontend/lib/auth.ts` exposes: `isLoggedIn()`, `getToken()`, `clearAuth()`, `subscribeAuthEvents()` (multi-tab logout broadcast).
- Storefront pages mount `MainLayout` which currently wraps `<Header />` and `<MobileSidebar />`.
- No `frontend/contexts/` directory yet — must be created.

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** Create `UserContext` to fetch + cache the logged-in user once per mount; sync across tabs via existing `subscribeAuthEvents`.

## Key Insights
- JWT lacks `full_name`, so the Header MUST hit `/users/me` — caching avoids per-page refetch.
- Hydration safety: `isLoggedIn()` reads `localStorage` → `false` on server. Initial state must be `loading: true, user: null` and the actual fetch must happen in `useEffect` (client-only).
- `subscribeAuthEvents` already broadcasts `logout` and `tokens-updated` across tabs.

## Requirements
**Functional**
- `useUser()` returns `{ user: User | null, loading: boolean, refresh: () => Promise<void>, setUser: (u: User | null) => void }`.
- On client mount: if `isLoggedIn()` → fetch `me.get()`, set user; else `user = null, loading = false`.
- On `logout` broadcast → `setUser(null)`.
- On `tokens-updated` broadcast → `refresh()`.
- On 401 from `me.get()` (e.g., refresh failed) → `setUser(null)` (no redirect — `request()` already handles redirect to `/login` for protected routes).

**Non-functional**
- Single fetch per provider mount; deduped via internal flag.
- Provider must NOT block first paint — render children with `user: null, loading: true` until fetch resolves.

## Architecture
```
<MainLayout>
  └─ <UserProvider>
       state: { user, loading }
       effect (mount):
         if isLoggedIn() → me.get() → setUser(data)
         subscribeAuthEvents:
           logout         → setUser(null)
           tokens-updated → refresh()
       └─ children (Header, pages)
```

Data flow:
- Inputs: `localStorage.access_token` (via `isLoggedIn`).
- Side-effects: HTTP `GET /users/me`, storage events from other tabs.
- Outputs: `{ user, loading }` consumed by `Header`, `account/page.tsx`.

## Related Code Files
**Create**
- `frontend/contexts/user-context.tsx` (client component, < 100 lines).

**Modify**
- `frontend/components/MainLayout.tsx` — wrap `{children}` (and Header/Sidebar) with `<UserProvider>`.

## Implementation Steps
1. Create `frontend/contexts/user-context.tsx` (file name kebab-case per project convention):
   ```tsx
   "use client";
   import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
   import type { User } from "@/types/api";
   import { isLoggedIn, subscribeAuthEvents } from "@/lib/auth";
   import { me as meApi } from "@/lib/api-resources";

   type Ctx = {
     user: User | null;
     loading: boolean;
     refresh: () => Promise<void>;
     setUser: (u: User | null) => void;
   };
   const UserCtx = createContext<Ctx | null>(null);

   export function UserProvider({ children }: { children: ReactNode }) {
     const [user, setUser] = useState<User | null>(null);
     const [loading, setLoading] = useState(true);

     const refresh = useCallback(async () => {
       if (!isLoggedIn()) { setUser(null); setLoading(false); return; }
       setLoading(true);
       try {
         const res = await meApi.get();
         setUser(res.data);
       } catch {
         setUser(null);
       } finally {
         setLoading(false);
       }
     }, []);

     useEffect(() => {
       refresh();
       const unsub = subscribeAuthEvents((e) => {
         if (e.type === "logout") setUser(null);
         if (e.type === "tokens-updated") refresh();
       });
       return unsub;
     }, [refresh]);

     return <UserCtx.Provider value={{ user, loading, refresh, setUser }}>{children}</UserCtx.Provider>;
   }

   export function useUser(): Ctx {
     const ctx = useContext(UserCtx);
     if (!ctx) throw new Error("useUser must be used within <UserProvider>");
     return ctx;
   }
   ```
2. Update `frontend/components/MainLayout.tsx`:
   ```tsx
   import { UserProvider } from "@/contexts/user-context";
   // wrap inside the existing <div>:
   <UserProvider>
     <Header onMenuClick={...} />
     <MobileSidebar ... />
     {children}
   </UserProvider>
   ```
3. Typecheck and run dev server; visit `/` while logged in — Network tab should show one `GET /api/v1/users/me`.

## Todo
- [ ] Create `frontend/contexts/user-context.tsx`
- [ ] Wrap `MainLayout` content with `<UserProvider>`
- [ ] Verify single `GET /users/me` per session
- [ ] Verify multi-tab logout clears user
- [ ] Typecheck passes

## Success Criteria
- Logging in then opening `/` triggers exactly one `me.get()` call.
- Logging out in tab A causes `useUser()` in tab B to return `user: null` without manual refresh.
- No SSR hydration warnings in console.
- `useUser()` outside provider throws a clear error (developer aid).

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hydration mismatch (server renders nothing for user, client paints something) | M | M | Initial state `user: null, loading: true` matches server; user only set after `useEffect` |
| Stale user after profile update | M | L | Phase 5 calls `refresh()` after PUT succeeds |
| Provider re-mounts on locale switch wiping cache | L | L | Acceptable — refetch is cheap, one request |
| `request()` triggers redirect to `/login` if `me.get()` 401s on a public page | M | M | Public pages also have `me.get()` failing → `request()` would redirect. Mitigation: in `refresh()` swallow ApiError 401 silently (catch already handles it) and `clearAuth()` is called by `request()` only when refresh itself fails. Verify behavior in test plan. |

## Security Considerations
- No tokens stored in context — only the `User` object.
- Provider renders on client only (`"use client"`), no risk of leaking through SSR.

## Next Steps
- Unblocks Phase 4 (Header consumes `useUser`).
- Unblocks Phase 5 (account page consumes + calls `refresh()` after edits).

# Refresh Token Auto-Retry Patterns for Next.js Frontend
**Date:** 2026-05-09 | **Focus:** Fetch-based 401 interception + race condition prevention + logout sync

---

## Executive Summary

Current implementation (`frontend/lib/api.ts`) has **zero refresh logic**: 401 throws immediately. Need pattern that:
- Intercepts 401, refreshes token silently, retries original request
- Prevents "token refresh stampede" (5-10 simultaneous refresh calls)
- Handles logout cleanly across multiple browser tabs
- Works with custom fetch (not axios)

**Recommended approach:** Promise deduplication + request queue + BroadcastChannel for multi-tab sync.

---

## 1. Race Condition Problem (The Core Issue)

### The Stampede

When access token expires and 5+ API calls fire simultaneously:
- Each request fails with 401
- Naive approach: each fails, triggers refresh independently
- Result: 5-10 refresh API calls instead of 1
  - Creates race conditions on backend token table
  - Some requests get old tokens, some get new
  - Inconsistent auth state, random logouts

### Real-World Impact
- [Shopware issue #13130](https://github.com/shopware/shopware/issues/13130): "Random Logouts in Administration Due to Refresh Token Race Condition"
- Axios-auth-refresh issue #288: Token API fails from race conditions across browser tabs

---

## 2. Core Solution: Promise Deduplication

### Pattern: One Promise, N Consumers

Instead of boolean flag, store **the promise itself**. All concurrent callers await same request.

```typescript
// BAD: Multiple refresh calls
let isRefreshing = false;
const getNewToken = async () => {
  if (isRefreshing) return; // Race condition!
  isRefreshing = true;
  const token = await refreshToken();
  isRefreshing = false;
  return token;
};

// GOOD: Deduped promise
let refreshPromise: Promise<TokenPair | null> | null = null;

async function ensureTokenRefreshed(): Promise<TokenPair | null> {
  if (refreshPromise) {
    return refreshPromise; // Piggyback on in-flight request
  }

  refreshPromise = refreshTokenAPI()
    .then((tokens) => {
      setTokens(tokens.accessToken, tokens.refreshToken);
      return tokens;
    })
    .catch((err) => {
      handleAuthFailure(err);
      return null;
    })
    .finally(() => {
      refreshPromise = null; // Clear for next refresh cycle
    });

  return refreshPromise;
}
```

**Why this works:**
- First request creates promise, stores it
- Requests 2-5 call `ensureTokenRefreshed()` again
- Function returns **same** promise reference
- All 5 requests await **one** network call
- Promise clears in finally block for next refresh cycle

**Source:** [40-line fix by Gracie Sharma](https://dev.to/graciesharma/youre-probably-refreshing-auth-tokens-wrong-heres-a-40-line-fix-11f6)

---

## 3. Request Body Buffering (Critical for Retries)

### The Problem

Fetch bodies are ReadableStream—consumed once, cannot be re-read.
```typescript
const res = await fetch(url, { body: JSON.stringify(data) });
await res.json(); // Body consumed

// Cannot re-read for retry — TypeError
const res2 = await res.json(); // FAILS
```

### Solution: Buffer Body Before Fetch

Store stringified body in memory, clone request for retries.

```typescript
async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = getToken();
  const method = options?.method || "GET";
  
  // Buffer body for potential retry
  let bodyBuffer: string | null = null;
  if (options?.body) {
    bodyBuffer = typeof options.body === "string"
      ? options.body
      : JSON.stringify(options.body);
  }

  const buildFetch = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept-Language": "vi",
      ...(options?.headers as Record<string, string>),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(`/api/v1${path}`, {
      ...options,
      method,
      headers,
      body: bodyBuffer, // Use buffered body for each attempt
    });
  };

  try {
    const res = await buildFetch();

    if (res.status === 401) {
      // Token expired — attempt refresh + retry
      const refreshed = await ensureTokenRefreshed();
      if (!refreshed) {
        throw new ApiError(401, "Authentication failed");
      }

      // Retry with new token
      const newToken = getToken();
      const retryHeaders = {
        "Content-Type": "application/json",
        "Accept-Language": "vi",
        ...(options?.headers as Record<string, string>),
      };
      if (newToken) {
        retryHeaders["Authorization"] = `Bearer ${newToken}`;
      }

      const retryRes = await fetch(`/api/v1${path}`, {
        ...options,
        method,
        headers: retryHeaders,
        body: bodyBuffer,
      });

      if (!retryRes.ok) {
        const body = await retryRes.json().catch(() => ({ error: "Request failed" }));
        throw new ApiError(retryRes.status, body.reason ?? body.error);
      }

      if (retryRes.status === 204) return undefined as T;
      return retryRes.json() as Promise<T>;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Request failed" }));
      throw new ApiError(res.status, body.reason ?? body.error, body.details);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, String(err));
  }
}
```

**Key points:**
- Body buffered as string before fetch
- `buildFetch()` helper creates request with buffered body
- If 401: refresh token, create new headers, fetch again with **same body**
- No ReadableStream exhaustion errors

---

## 4. Token Storage Trade-offs

| Strategy | Security | Convenience | Notes |
|----------|----------|-------------|-------|
| **localStorage** (current) | ❌ XSS vulnerable | ✅ Automatic | Any JS reads tokens; good for early dev |
| **httpOnly cookies** | ✅ XSS safe | ❌ Manual sync | Inaccessible to JS; backend controls; CSRF requires SameSite |
| **Memory + refresh cookie** | ✅ Best | ⚠️ Medium | Access token in memory (lost on refresh), refresh in httpOnly cookie |

### Current State
Project uses **localStorage**. This is:
- ❌ Vulnerable to XSS (any injected script reads tokens)
- ✅ Fine for development & admin dashboard
- ❌ Not suitable for production public app

### Recommended for Production
**Memory + httpOnly Cookie hybrid** (best security):
1. Access token: stored in memory (JavaScript variable)
2. Refresh token: stored in httpOnly cookie (set by backend)
3. On page load: app makes silent `/auth/refresh` call
4. Backend automatically sends refresh token cookie
5. App updates in-memory access token
6. Loss risk: page refresh = need silent refresh call (acceptable)

**Current localStorage approach is acceptable short-term** if:
- Admin dashboard only (not public-facing)
- XSS mitigations in place (CSP, input sanitization)
- Tokens short-lived (<15 min)

---

## 5. Multi-Tab Token Sync: BroadcastChannel

When user logs in/out or token refreshes in one tab, others should know immediately.

### BroadcastChannel Pattern

```typescript
// auth.ts — Token management with multi-tab sync
const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const BC_CHANNEL = 'auth-channel'; // Shared across tabs

const authChannel = new BroadcastChannel(BC_CHANNEL);

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);

  // Broadcast to other tabs
  authChannel.postMessage({
    type: 'TOKEN_UPDATED',
    payload: { accessToken, refreshToken },
  });
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);

  // Broadcast logout to other tabs
  authChannel.postMessage({
    type: 'AUTH_CLEARED',
  });
}

// Listen for auth changes from other tabs
authChannel.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === 'TOKEN_UPDATED') {
    // Another tab refreshed token — app could re-fetch user data
    console.log('Token updated from another tab');
  }

  if (type === 'AUTH_CLEARED') {
    // Another tab logged out — this tab should also clear and redirect
    clearAuth();
    window.location.href = '/login';
  }
};
```

**Key features:**
- ✅ Instant sync across tabs
- ✅ One refresh call per tab group (if coordinated)
- ✅ Logout cascades immediately
- ⚠️ Requires same origin (protocol + domain + port)
- ⚠️ No IE support (acceptable for modern apps)

**Limitation:** BroadcastChannel only works for same-origin; separate app origins (e.g., api.example.com vs app.example.com) need service-worker-based sync or backend-driven logout.

---

## 6. Logout Flow (Clean & Synchronized)

### Logout Sequence

```typescript
// pages/logout.ts (Server Action in Next.js App Router)
'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logout() {
  const cookie = await cookies();
  
  // 1. Call backend logout endpoint to invalidate refresh token
  await fetch('/api/v1/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
  }).catch(() => {}); // Ignore errors — token already expired

  // 2. Clear all tokens from client
  clearAuth(); // Removes from localStorage + broadcasts via BroadcastChannel

  // 3. Redirect to login
  redirect('/login');
}
```

```typescript
// app/logout/page.tsx
'use client';

import { logout } from '@/app/logout';

export default function LogoutPage() {
  return (
    <button onClick={() => logout()}>
      Logout
    </button>
  );
}
```

**Why this works:**
- Logout is server-side (cannot be bypassed by client-side token manipulation)
- Backend invalidates refresh token (prevents token reuse)
- Client clears all tokens and broadcasts to other tabs
- BroadcastChannel listener redirects other tabs automatically
- Clean, no token lingering in memory or cookies

---

## 7. Complete Implementation Pattern (api.ts)

```typescript
// lib/api.ts — With refresh logic

import type { JwtClaims, ApiErrorBody, ApiResponse } from '@/types/api';

const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// === REFRESH TOKEN DEDUPLICATION ===
let refreshPromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

async function ensureTokenRefreshed(): Promise<boolean> {
  if (refreshPromise) {
    return !!(await refreshPromise);
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        handleAuthFailure('No refresh token');
        return null;
      }

      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        handleAuthFailure('Refresh failed');
        return null;
      }

      const data = await res.json();
      const tokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };

      // Update tokens in storage + broadcast to other tabs
      localStorage.setItem('access_token', tokens.accessToken);
      localStorage.setItem('refresh_token', tokens.refreshToken);

      const channel = new BroadcastChannel('auth-channel');
      channel.postMessage({ type: 'TOKEN_UPDATED', payload: tokens });
      channel.close();

      return tokens;
    } catch (err) {
      handleAuthFailure(String(err));
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return !!(await refreshPromise);
}

function handleAuthFailure(reason: string): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');

  const channel = new BroadcastChannel('auth-channel');
  channel.postMessage({ type: 'AUTH_FAILED', reason });
  channel.close();

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

// === MAIN REQUEST FUNCTION ===
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET';

  // Buffer body for potential retry
  let bodyBuffer: string | null = null;
  if (options?.body) {
    bodyBuffer = typeof options.body === 'string'
      ? options.body
      : JSON.stringify(options.body);
  }

  const makeRequest = (token: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept-Language': 'vi',
      ...(options?.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${BASE}${path}`, {
      ...options,
      method,
      headers,
      body: bodyBuffer,
    });
  };

  let token = getToken();
  let res = await makeRequest(token);

  // === REFRESH & RETRY ON 401 ===
  if (res.status === 401) {
    const refreshed = await ensureTokenRefreshed();

    if (refreshed) {
      token = getToken();
      res = await makeRequest(token);
    } else {
      throw new ApiError(401, 'Authentication failed');
    }
  }

  // === HANDLE RESPONSE ===
  if (!res.ok) {
    const body: ApiErrorBody = await res
      .json()
      .catch(() => ({ error: 'Request failed' }));
    throw new ApiError(
      res.status,
      body.reason ?? body.error ?? 'Request failed',
      body.details,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path);
  },
  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  },
  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
  },
  // ... rest of API endpoints
};
```

---

## 8. Logout Listener Setup

Add to app initialization (e.g., `app/layout.tsx` or `providers.tsx`):

```typescript
'use client';

import { useEffect } from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Listen for logout/auth failures from other tabs
    const channel = new BroadcastChannel('auth-channel');

    channel.onmessage = (event) => {
      const { type } = event.data;

      if (type === 'AUTH_CLEARED' || type === 'AUTH_FAILED') {
        // Another tab logged out or auth failed
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    };

    return () => channel.close();
  }, []);

  return children;
}
```

---

## 9. Trade-off Matrix

| Aspect | Fetch Dedup | Promise Queue | Single Refresh Flag |
|--------|-------------|---------------|-------------------|
| Race condition safe | ✅ Yes | ✅ Yes | ❌ No |
| Implementation complexity | Simple (40 lines) | Medium | Low |
| Token refresh calls | 1 per stampede | 1 per stampede | 5-10 per stampede |
| Concurrent request retry | ✅ Clean | ✅ Clean | ❌ Messy |
| **Recommendation** | **✅ Use this** | Alternative | Don't use |

---

## 10. Adoption Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Body cloning adds slight memory overhead | Low | Accept for admin dashboard; optimize if needed |
| BroadcastChannel not supported in IE | Low | Admin dashboard (modern browsers only) |
| Token refresh endpoint timing (too slow) | Medium | Ensure backend refresh response < 200ms |
| Multiple logout calls (race condition) | Low | Deduped promise prevents this |
| Lost access token on page refresh (memory) | Low | Silent refresh call on app init (add if switching to memory storage) |

---

## Unresolved Questions

1. **Backend refresh endpoint:** Does it accept `refreshToken` in body or expect it in httpOnly cookie?
   - Current code assumes POST body; verify backend contract
   
2. **Token expiration time:** What are access/refresh token lifetimes?
   - Affects refresh frequency and security window
   
3. **Logout endpoint:** Does backend invalidate refresh token, or only clear session?
   - Impacts security of stolen refresh tokens
   
4. **Future storage migration:** Plan to move from localStorage to httpOnly cookies?
   - Would require backend changes (set cookies on login/refresh)
   - Current pattern supports both with minimal changes

---

## Sources

- [40-Line Promise Deduplication Fix](https://dev.to/graciesharma/youre-probably-refreshing-auth-tokens-wrong-heres-a-40-line-fix-11f6)
- [ts-retoken Library Implementation](https://dev.to/vanthao03596/stop-writing-token-refresh-logic-let-ts-retoken-handle-it-47cd)
- [Fetch Clone Request/Response](https://developer.mozilla.org/en-US/docs/Web/API/Request/clone)
- [BroadcastChannel API](https://developer.mozilla.org/en-US/blog/exploring-the-broadcast-channel-api-for-cross-tab-communication/)
- [Best Practices for Auth Token Refresh](https://github.com/orgs/community/discussions/184563)
- [httpOnly Cookies vs localStorage Security](https://www.wisp.blog/blog/understanding-token-storage-local-storage-vs-httponly-cookies)

# Phase 5: Frontend OAuth Callback

**Priority:** High | **Status:** completed | **Effort:** S

## Overview

Create callback page to handle OAuth redirect response, extract tokens from URL, and store them.

## Files

| Action | Path |
|--------|------|
| Create | `frontend/app/[locale]/login/callback/page.tsx` |

## Implementation

### OAuth Callback Page (`login/callback/page.tsx`)

```tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { setTokens } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const errorCode = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");

    // Handle error from OAuth provider
    if (errorCode) {
      setError(errorDesc || errorCode);
      return;
    }

    // Handle successful OAuth
    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      
      // Clear sensitive params from URL (browser history)
      window.history.replaceState({}, "", "/login/callback");
      
      // Redirect to home
      router.push("/");
      return;
    }

    // No tokens and no error - invalid state
    setError("Invalid OAuth callback. Please try again.");
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Đăng nhập thất bại</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    );
  }

  // Loading state while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}
```

## Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CALLBACK FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Backend redirects to:                                      │
│  /login/callback?access_token=xxx&refresh_token=xxx         │
│           OR                                                │
│  /login/callback?error=xxx&error_description=xxx            │
│                                                             │
│  ┌──────────────┐                                          │
│  │ Callback Page│                                          │
│  └──────┬───────┘                                          │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │ Has tokens?  │───►│ Store tokens │                      │
│  └──────┬───────┘    │ Clear URL    │                      │
│         │            │ Redirect /   │                      │
│         │ No         └──────────────┘                      │
│         ▼                                                   │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │ Has error?   │───►│ Show error   │                      │
│  └──────┬───────┘    │ Back to login│                      │
│         │            └──────────────┘                      │
│         │ No                                               │
│         ▼                                                   │
│  ┌──────────────┐                                          │
│  │ Invalid state│                                          │
│  │ Show error   │                                          │
│  └──────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Security Notes

- Tokens in URL are immediately extracted and URL is cleared via `replaceState`
- Prevents tokens from staying in browser history
- Error messages are user-friendly, no sensitive info exposed

## Todo

- [ ] Create callback page
- [ ] Test with mock tokens in URL
- [ ] Test error handling
- [ ] Verify URL is cleared after token extraction

## Verification

```bash
# Test success flow (manually navigate to)
http://localhost:3000/login/callback?access_token=test&refresh_token=test

# Test error flow
http://localhost:3000/login/callback?error=access_denied&error_description=User%20cancelled

# Verify no tokens in history after redirect
# Check browser history doesn't contain tokens
```

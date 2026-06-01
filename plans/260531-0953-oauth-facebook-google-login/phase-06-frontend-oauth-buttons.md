# Phase 6: Frontend OAuth Buttons

**Priority:** High | **Status:** completed | **Effort:** S

## Overview

Add Google and Facebook OAuth buttons to login and register pages.

## Files

| Action | Path |
|--------|------|
| Create | `frontend/components/oauth-buttons.tsx` |
| Modify | `frontend/app/[locale]/login/page.tsx` |
| Modify | `frontend/app/[locale]/register/page.tsx` |

## Implementation

### 1. OAuth Buttons Component (`oauth-buttons.tsx`)

```tsx
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface OAuthButtonsProps {
  disabled?: boolean;
}

export function OAuthButtons({ disabled }: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleOAuth = (provider: "google" | "facebook") => {
    setLoadingProvider(provider);
    const redirectUri = encodeURIComponent(
      window.location.origin + "/login/callback"
    );
    window.location.href = `/api/v1/auth/oauth/${provider}?redirect_uri=${redirectUri}`;
  };

  const isLoading = (provider: string) => loadingProvider === provider;
  const isDisabled = disabled || loadingProvider !== null;

  return (
    <div className="space-y-3">
      {/* Google Button */}
      <button
        type="button"
        onClick={() => handleOAuth("google")}
        disabled={isDisabled}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading("google") ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        <span className="font-medium text-gray-700">
          Tiếp tục với Google
        </span>
      </button>

      {/* Facebook Button */}
      <button
        type="button"
        onClick={() => handleOAuth("facebook")}
        disabled={isDisabled}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading("facebook") ? (
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        ) : (
          <FacebookIcon />
        )}
        <span className="font-medium text-white">
          Tiếp tục với Facebook
        </span>
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
```

### 2. Update Login Page (`login/page.tsx`)

Add OAuth buttons after the form:

```tsx
// Add import at top
import { OAuthButtons } from "@/components/oauth-buttons";

// Inside the component, after </form> and before the "no account" section:

{/* Divider */}
<div className="my-6 flex items-center">
  <div className="flex-1 border-t border-gray-200" />
  <span className="px-4 text-sm text-gray-500">hoặc</span>
  <div className="flex-1 border-t border-gray-200" />
</div>

{/* OAuth Buttons */}
<OAuthButtons disabled={loading} />
```

Full section to insert after line 162 (after `</form>`):

```tsx
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-4 text-sm text-gray-500">hoặc</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* OAuth Buttons */}
          <OAuthButtons disabled={loading} />

          <div className="mt-6 text-center">
```

### 3. Update Register Page (`register/page.tsx`)

Similar pattern - add OAuth buttons after the form:

```tsx
// Add import at top
import { OAuthButtons } from "@/components/oauth-buttons";

// After </form>, before "already have account" section:

{/* Divider */}
<div className="my-6 flex items-center">
  <div className="flex-1 border-t border-gray-200" />
  <span className="px-4 text-sm text-gray-500">hoặc</span>
  <div className="flex-1 border-t border-gray-200" />
</div>

{/* OAuth Buttons */}
<OAuthButtons disabled={loading} />
```

## Visual Design

```
┌─────────────────────────────────────┐
│           Login Form                │
│  ┌───────────────────────────────┐  │
│  │ Email                         │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Password                      │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │        Đăng nhập              │  │
│  └───────────────────────────────┘  │
│                                     │
│  ─────────── hoặc ───────────       │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  [G]  Tiếp tục với Google     │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  [f]  Tiếp tục với Facebook   │  │  (blue bg)
│  └───────────────────────────────┘  │
│                                     │
│  Chưa có tài khoản? Đăng ký ngay    │
└─────────────────────────────────────┘
```

## i18n (Optional Enhancement)

Add translations for button text:

```json
// vi.json
{
  "LoginPage": {
    "orContinueWith": "hoặc",
    "continueWithGoogle": "Tiếp tục với Google",
    "continueWithFacebook": "Tiếp tục với Facebook"
  }
}
```

## Todo

- [ ] Create oauth-buttons.tsx component
- [ ] Add OAuth buttons to login page
- [ ] Add OAuth buttons to register page
- [ ] Test button styling and hover states
- [ ] Test redirect to OAuth provider
- [ ] Add i18n support (optional)

## Verification

```bash
# Visual check
- Login page shows Google and Facebook buttons
- Register page shows Google and Facebook buttons
- Buttons have correct brand colors
- Loading state shows spinner

# Functional check
- Click Google → redirects to backend OAuth endpoint
- Click Facebook → redirects to backend OAuth endpoint
- Buttons disabled while form is submitting
```

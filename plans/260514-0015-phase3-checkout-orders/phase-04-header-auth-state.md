# Phase 4: Header Auth State

**Priority:** P2
**Effort:** 1h
**Status:** completed

## Overview

Update Header component to show user info when logged in and provide logout functionality.

## Context Links
- Header: `frontend/components/Header.tsx`
- Auth helpers: `frontend/lib/auth.ts`
- API client: `frontend/lib/api.ts`

## Current State

Header always shows login icon regardless of auth state:
```tsx
<Link href="/login">
  <User className="w-6 h-6 text-gray-700 hover:text-blue-600 transition-colors" />
</Link>
```

## Requirements

### Functional
- Check login status on mount
- When logged in: Show user dropdown with Profile, Orders, Logout
- When not logged in: Show login link
- Logout clears tokens and redirects to home

### Non-functional
- No layout shift on auth state change
- Dropdown closes on click outside
- i18n support

## Implementation Steps

### 1. Create User Dropdown Component

**File:** `frontend/components/user-dropdown.tsx`

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Package, LogOut, ChevronDown } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { clearTokens } from '@/lib/auth';
import { api } from '@/lib/api';

interface Props {
  user: { full_name: string; email: string } | null;
  onLogout: () => void;
}

export function UserDropdown({ user, onLogout }: Props) {
  const t = useTranslations('Header');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) {
    return (
      <Link href="/login">
        <User className="w-6 h-6 text-gray-700 hover:text-blue-600 transition-colors" />
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors"
      >
        <User className="w-6 h-6" />
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="font-medium text-sm text-gray-900 truncate">{user.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <Link
            href="/orders"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Package className="w-4 h-4" />
            {t('myOrders')}
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            {t('logout')}
          </button>
        </div>
      )}
    </div>
  );
}
```

### 2. Update Header Component

**File:** `frontend/components/Header.tsx`

Add user state and logout handler:

```tsx
import { useState, useEffect } from 'react';
import { isLoggedIn, clearTokens, getAccessToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { UserDropdown } from './user-dropdown';

export function Header({ onMenuClick }: HeaderProps) {
  // ... existing code ...
  
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null);

  useEffect(() => {
    if (isLoggedIn()) {
      api.get('/users/me')
        .then((res) => setUser(res.data))
        .catch(() => setUser(null));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore - still clear local tokens
    }
    clearTokens();
    setUser(null);
    router.push('/');
  };

  // Replace the User icon link with:
  <UserDropdown user={user} onLogout={handleLogout} />
}
```

### 3. Add i18n Keys

**File:** `frontend/messages/vn.json`
```json
{
  "Header": {
    "myOrders": "Đơn hàng của tôi",
    "logout": "Đăng xuất"
  }
}
```

### 4. Handle Cross-Tab Logout

The `clearTokens` function in `auth.ts` already uses BroadcastChannel:
```ts
export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  // BroadcastChannel for cross-tab sync
  const bc = new BroadcastChannel('auth');
  bc.postMessage({ type: 'logout' });
  bc.close();
}
```

Add listener in Header:
```tsx
useEffect(() => {
  const bc = new BroadcastChannel('auth');
  bc.onmessage = (e) => {
    if (e.data?.type === 'logout') {
      setUser(null);
    }
  };
  return () => bc.close();
}, []);
```

## Todo List

- [x] Create `frontend/components/user-dropdown.tsx`
- [x] Update Header to fetch user on mount
- [x] Implement logout functionality
- [x] Add cross-tab logout listener
- [x] Add i18n keys
- [x] Test login → see dropdown
- [x] Test logout → see login icon
- [x] Test cross-tab logout sync

## Success Criteria

- [x] Header shows login icon when not logged in
- [x] Header shows user dropdown when logged in
- [x] Dropdown shows user name and email
- [x] "My Orders" link navigates to /orders
- [x] Logout clears tokens and updates UI
- [x] Cross-tab logout sync works

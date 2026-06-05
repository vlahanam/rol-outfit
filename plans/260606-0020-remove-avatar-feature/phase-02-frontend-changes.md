# Phase 2: Frontend Changes

## Overview
Remove avatar upload UI and related code. Keep initials display.

## Tasks

### 2.1 Update User Type
File: `frontend/types/api.ts`

Remove line 194:
```typescript
// BEFORE
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar?: string;  // DELETE THIS LINE
  role: number;
  status: number;
  created_at: string;
  updated_at: string;
}
```

### 2.2 Remove uploadAvatar Function
File: `frontend/lib/api-resources.ts`

Delete the entire `uploadAvatar` function (~lines 249-275).

Keep the `upload` function (admin-only) if it exists.

### 2.3 Update Profile Page
File: `frontend/app/[locale]/(main)/profile/page.tsx`

**Step A:** Remove imports and refs:
- Remove `uploads` from imports (line 9)
- Remove `fileInputRef` useRef (line 15)

**Step B:** Remove `handleAvatarChange` function (~lines 57-72)

**Step C:** Update avatar section UI (~lines 138-173):

Replace the clickable avatar with static initials display:
```tsx
{/* Avatar Section */}
<div className="flex items-center gap-6 mb-8 p-6 bg-white rounded-lg shadow">
  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
    <span className="text-3xl text-gray-400 font-medium">
      {user?.full_name?.[0]?.toUpperCase()}
    </span>
  </div>
  <div>
    <h2 className="text-xl font-semibold">{user?.full_name}</h2>
    <p className="text-gray-500">{user?.email}</p>
  </div>
</div>
```

Remove:
- `onClick={handleAvatarClick}` and `cursor-pointer hover:opacity-80`
- Camera button overlay
- Hidden file input
- Avatar image display (`user?.avatar` conditional)

**Step D:** Clean up state:
- Remove avatar from `userProfile.update({ avatar: avatarUrl })` calls if any
- Remove avatar-related success/error messages

### 2.4 Verify TypeScript
```bash
cd frontend && npx tsc --noEmit
```

## Checklist
- [x] User type updated
- [x] uploadAvatar function deleted
- [x] Profile page upload UI removed
- [x] Initials display kept
- [x] No TypeScript errors

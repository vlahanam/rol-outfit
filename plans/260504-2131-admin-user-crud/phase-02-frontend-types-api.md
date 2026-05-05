---
phase: 2
title: Frontend - Types & API Client
status: completed
priority: high
completedOn: 2026-05-04
---

# Phase 2: Frontend - Types & API Client

## Overview

Thêm `User` type vào `types/api.ts` và các hàm gọi API admin user vào `lib/api.ts`.

## Related Files

- `frontend/types/api.ts`
- `frontend/lib/api.ts`

## Key Insights

- `lib/api.ts` đã có `api.get/post/put/delete` với auth header tự động — dùng lại trực tiếp
- Backend trả `role` và `status` dạng số nguyên — cần helper mapping sang tiếng Việt
- List API dùng `ApiResponse<User[]>` với `paging` (đã có `Paging` type)
- Không cần tạo file mới — thêm vào file hiện có

## Implementation Steps

### 1. Add `User` type to `types/api.ts`

```ts
export interface User {
  id: string;
  full_name: string;
  email: string;
  address: string;
  phone: string;
  role: number;   // 1=admin, 2=customer
  status: number; // 1=active, 0=locked
  created_at: string;
  updated_at: string;
}

export interface CreateUserPayload {
  full_name: string;
  email: string;
  password: string;
  address: string;
  phone: string;
  role?: number;
  status?: number;
}

export interface UpdateUserPayload {
  full_name?: string;
  email?: string;
  address?: string;
  phone?: string;
  role?: number;
  status?: number;
}
```

### 2. Add user admin API functions to `lib/api.ts`

Thêm vào object `api` các methods:

```ts
// Append to the api object in lib/api.ts:
adminUsers: {
  list(page = 1, limit = 20): Promise<ApiResponse<User[]>> {
    return request(`/admin/users?page=${page}&limit=${limit}`);
  },
  get(id: string): Promise<{ data: User }> {
    return request(`/admin/users/${id}`);
  },
  create(body: CreateUserPayload): Promise<{ data: User }> {
    return request(`/admin/users`, { method: 'POST', body: JSON.stringify(body) });
  },
  update(id: string, body: UpdateUserPayload): Promise<void> {
    return request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  remove(id: string): Promise<void> {
    return request(`/admin/users/${id}`, { method: 'DELETE' });
  },
},
```

**Lưu ý:** `update` và `remove` trả về `204 No Content` — `request()` hiện gọi `res.json()` nên cần xử lý 204. Kiểm tra `lib/api.ts` và điều chỉnh `request()` để trả về `null`/`undefined` khi status 204.

### 3. Add role/status helpers to `lib/api.ts` or inline in pages

```ts
export const ROLE_LABEL: Record<number, string> = { 1: 'Admin', 2: 'Khách hàng' };
export const STATUS_LABEL: Record<number, string> = { 1: 'Hoạt động', 0: 'Bị khóa' };
export const ROLE_VALUE: Record<string, number> = { 'Admin': 1, 'Khách hàng': 2 };
export const STATUS_VALUE: Record<string, number> = { 'Hoạt động': 1, 'Bị khóa': 0 };
```

## Todo

- [x] Add `User`, `CreateUserPayload`, `UpdateUserPayload` to `types/api.ts`
- [x] Fix `request()` in `lib/api.ts` to handle 204 No Content (return null instead of calling `.json()`)
- [x] Add `api.adminUsers` namespace with list/get/create/update/remove methods
- [x] Add role/status label maps to `lib/api.ts` (export for reuse in pages)

## Success Criteria

- TypeScript compiles without errors (`cd frontend && npx tsc --noEmit`)
- `api.adminUsers.list()` resolves to `ApiResponse<User[]>`
- 204 responses don't throw JSON parse errors

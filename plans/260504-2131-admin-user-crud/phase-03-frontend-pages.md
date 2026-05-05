---
phase: 3
title: Frontend - List, Add, Edit Pages
status: completed
priority: high
completedOn: 2026-05-04
---

# Phase 3: Frontend - List, Add, Edit Pages

## Overview

Thay thế mock data và console.log bằng real API calls trên 3 trang quản lý user.

## Related Files

- `frontend/app/admin/(protected)/users/page.tsx`
- `frontend/app/admin/(protected)/users/add/page.tsx`
- `frontend/app/admin/(protected)/users/[id]/edit/page.tsx`

## Key Insights

- Tất cả pages dùng `"use client"` — dùng `useEffect` + `useState` để fetch
- `ApiError` class từ `lib/api.ts` có `.status`, `.message`, `.details` — dùng để hiển thị lỗi
- Backend pagination: `paging.total`, `paging.page`, `paging.limit`
- Role/status mapping: import `ROLE_LABEL`, `STATUS_LABEL`, `ROLE_VALUE`, `STATUS_VALUE` từ `lib/api.ts`
- Delete: `204 No Content` — sau khi delete thành công, remove item khỏi local state
- Edit page: `useEffect` fetch user khi mount, dùng id từ `useParams`

## Implementation Steps

### 1. List Page (`users/page.tsx`)

**Xóa:** `mockUsers` array.

**Thêm state:**
```ts
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [page, setPage] = useState(1);
const [total, setTotal] = useState(0);
const LIMIT = 20;
```

**Fetch on mount:**
```ts
useEffect(() => {
  setLoading(true);
  api.adminUsers.list(page, LIMIT)
    .then(res => { setUsers(res.data); setTotal(res.paging?.total ?? 0); })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, [page]);
```

**Delete handler** (thay console.log):
```ts
const handleDelete = async (id: string) => {
  await api.adminUsers.remove(id);
  setUsers(prev => prev.filter(u => u.id !== id));
  setDeleteId(null);
};
```

**Display:** Map `user.role` → `ROLE_LABEL[user.role]`, `user.status` → `STATUS_LABEL[user.status]`.
**Date format:** `new Date(user.created_at).toLocaleDateString('vi-VN')`.
**Loading/Error states:** Hiển thị spinner hoặc thông báo lỗi thay cho bảng.
**Search:** Giữ client-side filter trên `users` state (đơn giản, không cần server-side search).

### 2. Add Page (`users/add/page.tsx`)

**Thêm state:**
```ts
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**handleSubmit** (thay console.log):
```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (formData.password !== formData.confirmPassword) {
    setError('Mật khẩu không khớp!');
    return;
  }
  setSubmitting(true);
  setError(null);
  try {
    await api.adminUsers.create({
      full_name: formData.fullName,
      email: formData.email,
      password: formData.password,
      address: formData.address,
      phone: formData.phone,
      role: ROLE_VALUE[formData.role],
      status: STATUS_VALUE[formData.status],
    });
    router.push('/admin/users');
  } catch (err) {
    setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
  } finally {
    setSubmitting(false);
  }
};
```

**UI:** Hiển thị `error` dưới form nếu có. Disable submit button khi `submitting`.

### 3. Edit Page (`users/[id]/edit/page.tsx`)

**Xóa:** Hardcoded initial state `{ fullName: 'Nguyễn Văn A', ... }`.

**Thêm state:**
```ts
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Fetch user on mount:**
```ts
useEffect(() => {
  if (!id) return;
  api.adminUsers.get(id)
    .then(res => {
      const u = res.data;
      setFormData({
        fullName: u.full_name,
        email: u.email,
        phone: u.phone,
        address: u.address,
        role: ROLE_LABEL[u.role] ?? 'Khách hàng',
        status: STATUS_LABEL[u.status] ?? 'Hoạt động',
        createdAt: new Date(u.created_at).toLocaleDateString('vi-VN'),
      });
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, [id]);
```

**handleSubmit** (thay console.log):
```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  setError(null);
  try {
    await api.adminUsers.update(id, {
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      role: ROLE_VALUE[formData.role],
      status: STATUS_VALUE[formData.status],
    });
    router.push('/admin/users');
  } catch (err) {
    setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
  } finally {
    setSubmitting(false);
  }
};
```

**"Hoạt Động" sidebar panel:** Thay hardcoded `createdAt` bằng data từ fetch.
**Loading state:** Hiển thị skeleton/spinner khi đang tải.

## Todo

- [x] **List page**: Remove mockUsers, add useEffect fetch, real delete, loading/error states, role/status label mapping
- [x] **Add page**: Replace console.log with api.adminUsers.create(), add error display, disable button while submitting
- [x] **Edit page**: Remove hardcoded data, fetch user by id on mount, replace console.log with api.adminUsers.update(), loading/error states
- [x] Run `cd frontend && npx tsc --noEmit` to check for type errors

## Success Criteria

- List page hiển thị users từ API, delete hoạt động, search/filter vẫn đúng
- Add page tạo user thật, redirect về list sau khi thành công, hiển thị lỗi nếu thất bại
- Edit page load dữ liệu user thật, cập nhật thành công, redirect về list
- Không còn mock data hay console.log thay cho API calls

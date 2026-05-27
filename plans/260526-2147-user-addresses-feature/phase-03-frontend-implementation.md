# Phase 3: Frontend Implementation

**Status:** pending | **Effort:** 45min | **Priority:** high

## Overview
Create addresses management page and add menu item to user dropdown.

## Files to Modify

### 1. Types (`frontend/types/api.ts`)
Add interface:
```typescript
export interface UserAddress {
  id: string;
  recipient_name: string;
  phone: string;
  address: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressPayload {
  recipient_name: string;
  phone: string;
  address: string;
}

export interface UpdateAddressPayload {
  recipient_name?: string;
  phone?: string;
  address?: string;
}
```

### 2. API Functions (`frontend/lib/api-resources.ts`)
Add resource:
```typescript
export const userAddresses = {
  list(): Promise<ApiResponse<UserAddress[]>> {
    return request<ApiResponse<UserAddress[]>>('/addresses');
  },
  create(body: CreateAddressPayload): Promise<{ data: UserAddress }> {
    return request<{ data: UserAddress }>('/addresses', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: UpdateAddressPayload): Promise<void> {
    return request<void>(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  remove(id: string): Promise<void> {
    return request<void>(`/addresses/${id}`, { method: 'DELETE' });
  },
  setDefault(id: string): Promise<void> {
    return request<void>(`/addresses/${id}/default`, { method: 'PUT' });
  },
};
```

### 3. User Dropdown (`frontend/components/user-dropdown.tsx`)
Add menu item between "My Orders" and "Logout":
```tsx
import { MapPin } from "lucide-react";
// ...
<Link
  href="/addresses"
  onClick={() => setOpen(false)}
  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
>
  <MapPin className="w-4 h-4" />
  {t("myAddresses")}
</Link>
```

### 4. i18n Messages
**en.json:**
```json
"Header": {
  "myAddresses": "My Addresses"
}
"AddressesPage": {
  "title": "My Addresses",
  "addNew": "Add New Address",
  "recipientName": "Recipient Name",
  "phone": "Phone Number",
  "address": "Address",
  "setDefault": "Set as Default",
  "default": "Default",
  "edit": "Edit",
  "delete": "Delete",
  "save": "Save",
  "cancel": "Cancel",
  "maxAddresses": "Maximum 5 addresses allowed",
  "confirmDelete": "Delete this address?",
  "noAddresses": "No addresses yet"
}
```

**vn.json:**
```json
"Header": {
  "myAddresses": "Địa chỉ của tôi"
}
"AddressesPage": {
  "title": "Địa chỉ của tôi",
  "addNew": "Thêm địa chỉ mới",
  "recipientName": "Tên người nhận",
  "phone": "Số điện thoại",
  "address": "Địa chỉ",
  "setDefault": "Đặt làm mặc định",
  "default": "Mặc định",
  "edit": "Sửa",
  "delete": "Xóa",
  "save": "Lưu",
  "cancel": "Hủy",
  "maxAddresses": "Tối đa 5 địa chỉ",
  "confirmDelete": "Xóa địa chỉ này?",
  "noAddresses": "Chưa có địa chỉ nào"
}
```

## Files to Create

### Addresses Page (`frontend/app/[locale]/(main)/addresses/page.tsx`)

Features:
- List all addresses with default badge
- Add new address form (modal or inline)
- Edit address (inline edit)
- Delete with confirmation
- Set default button
- Max 5 validation (disable add button when reached)
- Protected route (redirect to login if not authenticated)

UI Structure:
```
┌─────────────────────────────────────────┐
│ My Addresses              [+ Add New]   │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Nguyen Van A        ★ Default       │ │
│ │ 0901234567                          │ │
│ │ 123 ABC Street, District 1, HCMC   │ │
│ │                    [Edit] [Delete]  │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Tran Thi B          [Set Default]   │ │
│ │ 0909876543                          │ │
│ │ 456 XYZ Street, District 2, HCMC   │ │
│ │                    [Edit] [Delete]  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Todo
- [ ] Add TypeScript interfaces
- [ ] Add API functions
- [ ] Add i18n keys (en + vn)
- [ ] Update user-dropdown with new menu item
- [ ] Create addresses page with CRUD
- [ ] Test page functionality

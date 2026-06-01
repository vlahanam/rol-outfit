# Phase 2: Frontend Profile Page

**Status:** pending
**Priority:** high
**Effort:** ~2 hours
**Depends on:** Phase 1 (backend changes)

## Overview

Create profile page with avatar upload, personal info editing, and password change form.

## Files to Modify

| File | Change |
|------|--------|
| `frontend/components/user-dropdown.tsx` | Add "Thông tin tài khoản" menu item |
| `frontend/app/[locale]/(main)/profile/page.tsx` | NEW - profile page |
| `frontend/lib/api-resources.ts` | Add userProfile resource |
| `frontend/types/api.ts` | Add avatar to User type |
| `frontend/messages/vn.json` | Add i18n keys |
| `frontend/messages/jp.json` | Add i18n keys |

## Implementation Steps

### Step 1: Update User Type

```typescript
// types/api.ts
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar?: string;  // NEW
  role: number;
  status: number;
  created_at: string;
  updated_at: string;
}
```

### Step 2: Add API Resources

```typescript
// lib/api-resources.ts
export const userProfile = {
  get: () => api.get<ApiResponse<User>>("/users/me"),
  update: (body: { full_name?: string; phone?: string; avatar?: string }) =>
    api.put("/users/me", body),
  changePassword: (body: { current_password: string; new_password: string }) =>
    api.put("/users/me/password", body),
};
```

### Step 3: Update UserDropdown

```tsx
// components/user-dropdown.tsx
// Add import
import { User as UserIcon } from "lucide-react";

// Add menu item (first in list, before "Đơn hàng của tôi")
<Link
  href="/profile"
  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
  onClick={() => setIsOpen(false)}
>
  <UserIcon className="inline-block w-4 h-4 mr-2" />
  Thông tin tài khoản
</Link>
```

### Step 4: Create Profile Page

```tsx
// app/[locale]/(main)/profile/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { isLoggedIn } from "@/lib/auth";
import { userProfile, uploads } from "@/lib/api-resources";
import { User, ApiResponse } from "@/types/api";
import { Camera, Save, Eye, EyeOff } from "lucide-react";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Personal info form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    fetchUser();
  }, [router]);

  const fetchUser = async () => {
    try {
      const res = await userProfile.get();
      setUser(res.data);
      setFullName(res.data.full_name);
      setPhone(res.data.phone || "");
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setSaving(true);
      const uploadRes = await uploads.upload(file);
      const avatarUrl = uploadRes.data.url;
      await userProfile.update({ avatar: avatarUrl });
      setUser(prev => prev ? { ...prev, avatar: avatarUrl } : null);
      setSuccess(t("avatar_updated"));
    } catch (err) {
      setError(t("avatar_upload_failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    try {
      setSaving(true);
      await userProfile.update({ full_name: fullName, phone: phone || undefined });
      setSuccess(t("update_success"));
      setUser(prev => prev ? { ...prev, full_name: fullName, phone } : null);
    } catch (err: any) {
      setError(err.message || t("update_failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    
    if (newPassword !== confirmPassword) {
      setPasswordError(t("password_mismatch"));
      return;
    }
    
    try {
      setSaving(true);
      await userProfile.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess(t("password_changed"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || t("password_change_failed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">{t("title")}</h1>
      
      {/* Avatar Section */}
      <div className="flex items-center gap-6 mb-8 p-6 bg-white rounded-lg shadow">
        <div className="relative">
          <div 
            className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80"
            onClick={handleAvatarClick}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-gray-400">{user?.full_name?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <button 
            className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600"
            onClick={handleAvatarClick}
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{user?.full_name}</h2>
          <p className="text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Personal Info Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">{t("personal_info")}</h3>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}
        
        <form onSubmit={handleUpdateInfo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("full_name")}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("email")}</label>
            <input
              type="email"
              value={user?.email || ""}
              className="w-full px-3 py-2 border rounded-lg bg-gray-100"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">{t("email_readonly")}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("phone")}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {t("save")}
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t("change_password")}</h3>
        
        {passwordError && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{passwordError}</div>}
        {passwordSuccess && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{passwordSuccess}</div>}
        
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium mb-1">{t("current_password")}</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("new_password")}</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("confirm_password")}</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-sm text-gray-600 flex items-center gap-1"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPasswords ? t("hide_passwords") : t("show_passwords")}
            </button>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {t("change_password")}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### Step 5: Add i18n Keys

```json
// messages/vn.json - add under root
{
  "profile": {
    "title": "Thông tin tài khoản",
    "personal_info": "Thông tin cá nhân",
    "full_name": "Họ tên",
    "email": "Email",
    "email_readonly": "Email không thể thay đổi",
    "phone": "Số điện thoại",
    "save": "Lưu thay đổi",
    "change_password": "Đổi mật khẩu",
    "current_password": "Mật khẩu hiện tại",
    "new_password": "Mật khẩu mới",
    "confirm_password": "Xác nhận mật khẩu mới",
    "show_passwords": "Hiện mật khẩu",
    "hide_passwords": "Ẩn mật khẩu",
    "password_mismatch": "Mật khẩu xác nhận không khớp",
    "password_changed": "Đổi mật khẩu thành công",
    "update_success": "Cập nhật thành công",
    "update_failed": "Cập nhật thất bại",
    "avatar_updated": "Cập nhật ảnh đại diện thành công",
    "avatar_upload_failed": "Tải ảnh thất bại",
    "password_change_failed": "Đổi mật khẩu thất bại"
  }
}
```

```json
// messages/jp.json - add under root
{
  "profile": {
    "title": "アカウント情報",
    "personal_info": "個人情報",
    "full_name": "氏名",
    "email": "メールアドレス",
    "email_readonly": "メールアドレスは変更できません",
    "phone": "電話番号",
    "save": "保存",
    "change_password": "パスワード変更",
    "current_password": "現在のパスワード",
    "new_password": "新しいパスワード",
    "confirm_password": "パスワード確認",
    "show_passwords": "パスワードを表示",
    "hide_passwords": "パスワードを非表示",
    "password_mismatch": "パスワードが一致しません",
    "password_changed": "パスワードを変更しました",
    "update_success": "更新しました",
    "update_failed": "更新に失敗しました",
    "avatar_updated": "プロフィール画像を更新しました",
    "avatar_upload_failed": "画像のアップロードに失敗しました",
    "password_change_failed": "パスワードの変更に失敗しました"
  }
}
```

## Todo

- [ ] Add avatar to User type
- [ ] Add userProfile API resource
- [ ] Update UserDropdown with menu item
- [ ] Create profile page component
- [ ] Add Vietnamese i18n keys
- [ ] Add Japanese i18n keys
- [ ] Run `npm run build` to verify compilation
- [ ] Test UI in browser

## Verification

1. Navigate to http://localhost/
2. Login with test account
3. Click user dropdown → "Thông tin tài khoản"
4. Verify profile page displays user info
5. Test update name/phone
6. Test avatar upload
7. Test password change

import { getRefreshToken, clearAuth } from "@/lib/auth";
import { ApiError, BASE, request, getLangFromLocale } from "@/lib/api-client";
import {
  adminUsers,
  adminProducts,
  adminCategories,
  adminTags,
  adminWidgets,
  adminCarts,
  uploads,
  products,
} from "@/lib/api-resources";

export { ApiError } from "@/lib/api-client";

export const CATEGORY_STATUS_LABEL: Record<number, string> = { 1: "Hiển thị", 2: "Ẩn" };
export const CATEGORY_STATUS_VALUE: Record<string, number> = { "Hiển thị": 1, "Ẩn": 2 };

export const WIDGET_STATUS_LABEL: Record<number, string> = { 1: "Ẩn", 2: "Hiển thị" };
export const WIDGET_TYPE_LABEL: Record<string, string> = {
  "banner-slider":   "Banner Slider",
  "collection-grid": "Bộ sưu tập đặc biệt",
  "new-product":     "Hàng mới về",
  "trend-hot":       "Xu hướng hot",
};

export const ROLE_LABEL: Record<number, string> = {
  1: "Admin",
  2: "Khách hàng",
};
export const STATUS_LABEL: Record<number, string> = {
  1: "Hoạt động",
  0: "Bị khóa",
};
export const ROLE_VALUE: Record<string, number> = { Admin: 1, "Khách hàng": 2 };
export const STATUS_VALUE: Record<string, number> = {
  "Hoạt động": 1,
  "Bị khóa": 0,
};

export const api = {
  get<T>(path: string, locale?: string): Promise<T> {
    return request<T>(path, { locale });
  },
  post<T>(path: string, body?: unknown, locale?: string): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: body != null ? JSON.stringify(body) : undefined,
      locale,
    });
  },
  put<T>(path: string, body?: unknown, locale?: string): Promise<T> {
    return request<T>(path, {
      method: "PUT",
      body: body != null ? JSON.stringify(body) : undefined,
      locale,
    });
  },
  delete<T>(path: string, locale?: string): Promise<T> {
    return request<T>(path, { method: "DELETE", locale });
  },

  auth: {
    logout(): Promise<void> {
      const refreshToken = getRefreshToken();
      // Best-effort: swallow network errors — local state always cleared
      return fetch(`${BASE}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": "vi",
        },
        body: JSON.stringify({ refresh_token: refreshToken ?? "" }),
      })
        .catch(() => {})
        .then(() => {
          clearAuth();
        });
    },
  },

  adminUsers,
  adminProducts,
  adminCategories,
  adminTags,
  adminWidgets,
  adminCarts,
  uploads,
  products,
};

import { getRefreshToken, clearAuth } from "@/lib/auth";
import { ApiError, BASE, request } from "@/lib/api-client";
import {
  adminUsers,
  adminProducts,
  adminCategories,
  adminTags,
  adminWidgets,
  uploads,
} from "@/lib/api-resources";

export { ApiError } from "@/lib/api-client";

export const CATEGORY_STATUS_LABEL: Record<number, string> = { 1: "Hiển thị", 2: "Ẩn" };
export const CATEGORY_STATUS_VALUE: Record<string, number> = { "Hiển thị": 1, "Ẩn": 2 };

export const WIDGET_STATUS_LABEL: Record<number, string> = { 1: "Ẩn", 2: "Hiển thị" };
export const WIDGET_TYPE_LABEL: Record<string, string> = {
  container: "Container",
  image: "Hình ảnh",
  chart: "Biểu đồ",
  table: "Bảng",
  stat: "Thống kê",
  text: "Văn bản",
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
  get<T>(path: string): Promise<T> {
    return request<T>(path);
  },
  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: "POST", body: JSON.stringify(body) });
  },
  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: "PUT", body: JSON.stringify(body) });
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
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
  uploads,
};

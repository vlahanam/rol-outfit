import type {
  ApiErrorBody,
  ApiResponse,
  User,
  CreateUserPayload,
  UpdateUserPayload,
  AdminProduct,
  Product,
  ProductVariant,
  CreateProductPayload,
  UpdateProductPayload,
  CreateVariantPayload,
  UpdateVariantPayload,
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "@/types/api";

const BASE = "/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Language": "vi",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body: ApiErrorBody = await res
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new ApiError(
      res.status,
      body.reason ?? body.error ?? "Request failed",
      body.details,
    );
  }

  // 204 No Content — nothing to parse
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const CATEGORY_STATUS_LABEL: Record<number, string> = { 1: "Hiển thị", 2: "Ẩn" };
export const CATEGORY_STATUS_VALUE: Record<string, number> = { "Hiển thị": 1, "Ẩn": 2 };

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

  adminUsers: {
    list(page = 1, limit = 20): Promise<ApiResponse<User[]>> {
      return request<ApiResponse<User[]>>(
        `/admin/users?page=${page}&limit=${limit}`,
      );
    },
    get(id: string): Promise<{ data: User }> {
      return request<{ data: User }>(`/admin/users/${id}`);
    },
    create(body: CreateUserPayload): Promise<{ data: User }> {
      return request<{ data: User }>(`/admin/users`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    update(id: string, body: UpdateUserPayload): Promise<void> {
      return request<void>(`/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    remove(id: string): Promise<void> {
      return request<void>(`/admin/users/${id}`, { method: "DELETE" });
    },
  },

  adminProducts: {
    list(params?: {
      page?: number;
      limit?: number;
      category_id?: string;
      search?: string;
    }): Promise<ApiResponse<AdminProduct[]>> {
      const p = params ?? {};
      const qs = new URLSearchParams();
      if (p.page) qs.set("page", String(p.page));
      if (p.limit) qs.set("limit", String(p.limit));
      if (p.category_id) qs.set("category_id", p.category_id);
      if (p.search) qs.set("search", p.search);
      const query = qs.toString();
      return request<ApiResponse<AdminProduct[]>>(
        `/admin/products${query ? `?${query}` : ""}`,
      );
    },
    get(id: string): Promise<{ data: AdminProduct }> {
      return request<{ data: AdminProduct }>(`/admin/products/${id}`);
    },
    create(body: CreateProductPayload): Promise<{ data: Product }> {
      return request<{ data: Product }>(`/products`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    update(id: string, body: UpdateProductPayload): Promise<void> {
      return request<void>(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    remove(id: string): Promise<void> {
      return request<void>(`/products/${id}`, { method: "DELETE" });
    },
    createVariant(
      productId: string,
      body: CreateVariantPayload,
    ): Promise<{ data: ProductVariant }> {
      return request<{ data: ProductVariant }>(
        `/products/${productId}/variants`,
        { method: "POST", body: JSON.stringify(body) },
      );
    },
    updateVariant(
      productId: string,
      variantId: string,
      body: UpdateVariantPayload,
    ): Promise<void> {
      return request<void>(`/products/${productId}/variants/${variantId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    removeVariant(productId: string, variantId: string): Promise<void> {
      return request<void>(`/products/${productId}/variants/${variantId}`, {
        method: "DELETE",
      });
    },
  },

  adminCategories: {
    list(params?: { page?: number; limit?: number }): Promise<ApiResponse<Category[]>> {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return request<ApiResponse<Category[]>>(
        `/admin/categories${query ? `?${query}` : ""}`,
      );
    },
    get(id: string): Promise<{ data: Category }> {
      return request<{ data: Category }>(`/admin/categories/${id}`);
    },
    create(body: CreateCategoryPayload): Promise<{ data: Category }> {
      return request<{ data: Category }>(`/categories`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    update(id: string, body: UpdateCategoryPayload): Promise<void> {
      return request<void>(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    remove(id: string): Promise<void> {
      return request<void>(`/categories/${id}`, { method: "DELETE" });
    },
  },

  uploads: {
    async upload(file: File): Promise<string> {
      const token = getToken();
      const form = new FormData();
      form.append("file", file);

      const headers: Record<string, string> = { "Accept-Language": "vi" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${BASE}/uploads`, {
        method: "POST",
        headers,
        body: form,
      });

      if (!res.ok) {
        const body: ApiErrorBody = await res
          .json()
          .catch(() => ({ error: "Upload failed" }));
        throw new ApiError(
          res.status,
          body.reason ?? body.error ?? "Upload failed",
        );
      }

      const data: { url: string } = await res.json();
      return data.url;
    },

    delete(filename: string): Promise<void> {
      return request<void>(`/uploads/${filename}`, { method: "DELETE" });
    },
  },
};

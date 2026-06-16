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
  Tag,
  CreateTagPayload,
  UpdateTagPayload,
  Widget,
  CreateWidgetPayload,
  UpdateWidgetPayload,
  UserAddress,
  CreateAddressPayload,
  UpdateAddressPayload,
  AdminCartListItem,
  AdminCartDetail,
  DashboardStats,
} from "@/types/api";
import { ApiError, BASE, getToken, request } from "@/lib/api-client";

export const adminUsers = {
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
};

export const adminProducts = {
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
  assignTags(productId: string, tagIds: string[]): Promise<void> {
    return request<void>(`/products/${productId}/tags`, {
      method: "PUT",
      body: JSON.stringify({ tag_ids: tagIds }),
    });
  },
};

export const adminCategories = {
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
};

export const adminTags = {
  list(params?: { page?: number; limit?: number }): Promise<ApiResponse<Tag[]>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return request<ApiResponse<Tag[]>>(`/admin/tags${query ? `?${query}` : ""}`);
  },
  listAll(): Promise<ApiResponse<Tag[]>> {
    return request<ApiResponse<Tag[]>>(`/admin/tags?limit=100`);
  },
  get(id: string): Promise<{ data: Tag }> {
    return request<{ data: Tag }>(`/admin/tags/${id}`);
  },
  create(body: CreateTagPayload): Promise<{ data: Tag }> {
    return request<{ data: Tag }>(`/tags`, { method: "POST", body: JSON.stringify(body) });
  },
  update(id: string, body: UpdateTagPayload): Promise<void> {
    return request<void>(`/tags/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  remove(id: string): Promise<void> {
    return request<void>(`/tags/${id}`, { method: "DELETE" });
  },
};

export const adminWidgets = {
  list(params?: { page?: number; limit?: number; parent_id?: string }): Promise<ApiResponse<Widget[]>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.parent_id) qs.set("parent_id", params.parent_id);
    const query = qs.toString();
    return request<ApiResponse<Widget[]>>(`/admin/widgets${query ? `?${query}` : ""}`);
  },
  get(id: string): Promise<{ data: Widget }> {
    return request<{ data: Widget }>(`/admin/widgets/${id}`);
  },
  create(body: CreateWidgetPayload): Promise<{ data: Widget }> {
    return request<{ data: Widget }>(`/widgets`, { method: "POST", body: JSON.stringify(body) });
  },
  update(id: string, body: UpdateWidgetPayload): Promise<void> {
    return request<void>(`/widgets/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  remove(id: string): Promise<void> {
    return request<void>(`/widgets/${id}`, { method: "DELETE" });
  },
};

export const adminCarts = {
  list(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<AdminCartListItem[]>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString();
    return request<ApiResponse<AdminCartListItem[]>>(`/admin/carts${query ? `?${query}` : ""}`);
  },
  get(id: string): Promise<{ data: AdminCartDetail }> {
    return request<{ data: AdminCartDetail }>(`/admin/carts/${id}`);
  },
  remove(id: string): Promise<void> {
    return request<void>(`/admin/carts/${id}`, { method: "DELETE" });
  },
};

export const uploads = {
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
};

export const products = {
  listByTags(params: { tags?: string[]; limit?: number }): Promise<ApiResponse<Product[]>> {
    const qs = new URLSearchParams();
    if (params.tags?.length) qs.set("tags", params.tags.join(","));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return request<ApiResponse<Product[]>>(`/products${query ? `?${query}` : ""}`);
  },
  search(query: string, limit = 6): Promise<ApiResponse<Product[]>> {
    const qs = new URLSearchParams();
    qs.set("search", query);
    qs.set("limit", String(limit));
    return request<ApiResponse<Product[]>>(`/products?${qs.toString()}`);
  },
};

export const userAddresses = {
  list(): Promise<ApiResponse<UserAddress[]>> {
    return request<ApiResponse<UserAddress[]>>("/addresses");
  },
  create(body: CreateAddressPayload): Promise<{ data: UserAddress }> {
    return request<{ data: UserAddress }>("/addresses", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: UpdateAddressPayload): Promise<void> {
    return request<void>(`/addresses/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  remove(id: string): Promise<void> {
    return request<void>(`/addresses/${id}`, { method: "DELETE" });
  },
  setDefault(id: string): Promise<void> {
    return request<void>(`/addresses/${id}/default`, { method: "PUT" });
  },
};

export const userProfile = {
  get(): Promise<{ data: User }> {
    return request<{ data: User }>("/users/me");
  },
  update(body: { full_name?: string; phone?: string }): Promise<void> {
    return request<void>("/users/me", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  changePassword(body: { current_password: string; new_password: string }): Promise<void> {
    return request<void>("/users/me/password", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
};

export const adminDashboard = {
  getStats(): Promise<{ data: DashboardStats }> {
    return request<{ data: DashboardStats }>("/admin/dashboard");
  },
};

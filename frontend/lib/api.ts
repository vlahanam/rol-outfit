import type { ApiErrorBody, ApiResponse, User, CreateUserPayload, UpdateUserPayload } from '@/types/api';

const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': 'vi',
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body: ApiErrorBody = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(res.status, body.reason ?? body.error ?? 'Request failed', body.details);
  }

  // 204 No Content — nothing to parse
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const ROLE_LABEL: Record<number, string> = { 1: 'Admin', 2: 'Khách hàng' };
export const STATUS_LABEL: Record<number, string> = { 1: 'Hoạt động', 0: 'Bị khóa' };
export const ROLE_VALUE: Record<string, number> = { 'Admin': 1, 'Khách hàng': 2 };
export const STATUS_VALUE: Record<string, number> = { 'Hoạt động': 1, 'Bị khóa': 0 };

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path);
  },
  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  },
  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
  },

  adminUsers: {
    list(page = 1, limit = 20): Promise<ApiResponse<User[]>> {
      return request<ApiResponse<User[]>>(`/admin/users?page=${page}&limit=${limit}`);
    },
    get(id: string): Promise<{ data: User }> {
      return request<{ data: User }>(`/admin/users/${id}`);
    },
    create(body: CreateUserPayload): Promise<{ data: User }> {
      return request<{ data: User }>(`/admin/users`, { method: 'POST', body: JSON.stringify(body) });
    },
    update(id: string, body: UpdateUserPayload): Promise<void> {
      return request<void>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    },
    remove(id: string): Promise<void> {
      return request<void>(`/admin/users/${id}`, { method: 'DELETE' });
    },
  },
};

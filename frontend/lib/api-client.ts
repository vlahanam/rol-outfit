import type { ApiErrorBody, AuthTokens } from "@/types/api";
import { getRefreshToken, setTokens, clearAuth } from "@/lib/auth";

export const BASE = "/api/v1";

const localeToLang: Record<string, string> = {
  vn: "vi",
  jp: "ja",
};

export function getLangFromLocale(locale?: string): string {
  if (!locale) return "vi";
  return localeToLang[locale] ?? "vi";
}

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

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

// Module-level refresh promise for deduplication (prevents concurrent refresh stampede)
let refreshPromise: Promise<AuthTokens> | null = null;

async function doRefresh(): Promise<AuthTokens> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError(401, "No refresh token");
  }

  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept-Language": "vi" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    throw new ApiError(res.status, "Token refresh failed");
  }

  const data = await res.json();
  const tokens = data.data as AuthTokens;
  setTokens(tokens.access_token, tokens.refresh_token);
  return tokens;
}

export function ensureTokenRefreshed(): Promise<AuthTokens> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export function handleAuthFailure(): void {
  clearAuth(); // broadcasts logout to other tabs
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export async function request<T>(
  path: string,
  options?: RequestInit & { locale?: string }
): Promise<T> {
  const token = getToken();
  const lang = getLangFromLocale(options?.locale);

  // Guard: non-JSON body types (FormData, Blob, ArrayBuffer) cannot be re-sent on retry.
  // Route those through fetch() directly (see uploads.upload for the pattern).
  if (
    options?.body instanceof FormData ||
    options?.body instanceof Blob ||
    options?.body instanceof ArrayBuffer
  ) {
    throw new Error("request() does not support non-JSON bodies; use fetch() directly");
  }

  // Pre-serialize body to string for potential retry (fetch streams are single-use)
  const bodyStr =
    options?.body != null
      ? typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body)
      : undefined;

  const buildHeaders = (accessToken: string | null): Record<string, string> => {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept-Language": lang,
      ...(options?.headers as Record<string, string>),
    };
    if (accessToken) h["Authorization"] = `Bearer ${accessToken}`;
    return h;
  };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: buildHeaders(token),
    body: bodyStr,
  });

  if (res.status === 401 && path !== "/auth/refresh" && getRefreshToken()) {
    try {
      await ensureTokenRefreshed();
    } catch {
      handleAuthFailure();
      throw new ApiError(401, "Authentication failed");
    }

    const retryRes = await fetch(`${BASE}${path}`, {
      ...options,
      headers: buildHeaders(getToken()),
      body: bodyStr,
    });

    if (retryRes.status === 401) {
      handleAuthFailure();
      throw new ApiError(401, "Authentication failed");
    }

    if (!retryRes.ok) {
      const body: ApiErrorBody = await retryRes
        .json()
        .catch(() => ({ error: "Request failed" }));
      throw new ApiError(
        retryRes.status,
        body.reason ?? body.error ?? "Request failed",
        body.details,
      );
    }

    if (retryRes.status === 204) return undefined as T;
    return retryRes.json() as Promise<T>;
  }

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

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

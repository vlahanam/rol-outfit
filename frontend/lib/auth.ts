import type { JwtClaims } from '@/types/api';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

/** Decode JWT payload without verifying signature (client-side only). */
export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtClaims;
  } catch {
    return null;
  }
}

/** Returns role number from stored JWT, or null if not logged in. */
export function getUserRole(): number | null {
  const token = getToken();
  if (!token) return null;
  const claims = decodeJwt(token);
  return claims?.role ?? null;
}

/** Returns true if the stored token belongs to an admin (role === 1). */
export function isAdmin(): boolean {
  return getUserRole() === 1;
}

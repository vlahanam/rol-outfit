import type { JwtClaims } from '@/types/api';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

// BroadcastChannel for multi-tab logout sync (feature-detected)
const authChannel =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('auth') : null;

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  authChannel?.postMessage({ type: 'tokens-updated' });
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  authChannel?.postMessage({ type: 'logout' });
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

/**
 * Subscribe to auth events from other tabs (logout, tokens-updated).
 * Returns an unsubscribe function.
 */
export function subscribeAuthEvents(
  handler: (event: { type: 'logout' | 'tokens-updated' }) => void,
): () => void {
  if (!authChannel) return () => {};
  const listener = (e: MessageEvent) => handler(e.data as { type: 'logout' | 'tokens-updated' });
  authChannel.addEventListener('message', listener);
  return () => authChannel.removeEventListener('message', listener);
}

import { useEffect, useRef, useCallback } from 'react';
import {
  isLoggedIn,
  isTokenExpiringSoon,
  isTokenExpired,
  subscribeAuthEvents,
  clearAuth,
} from '@/lib/auth';
import { ensureTokenRefreshed } from '@/lib/api-client';

// Check interval in milliseconds (30 seconds)
const CHECK_INTERVAL = 30_000;

interface UseTokenRefreshOptions {
  /** Whether to enable periodic checking. Default: true */
  enabled?: boolean;
  /** Callback when auth fails and requireAuth is true */
  onAuthFailure?: () => void;
  /** Whether to require login (call onAuthFailure if not logged in). Default: false */
  requireAuth?: boolean;
}

/**
 * Hook that periodically checks token expiry and refreshes proactively.
 * Also handles auth events from other tabs.
 */
export function useTokenRefresh(options: UseTokenRefreshOptions = {}) {
  const { enabled = true, requireAuth = false, onAuthFailure } = options;
  const refreshingRef = useRef(false);

  const doRefresh = useCallback(async (): Promise<boolean> => {
    if (refreshingRef.current) return true;
    if (!isLoggedIn()) return false;

    refreshingRef.current = true;
    try {
      await ensureTokenRefreshed();
      return true;
    } catch {
      clearAuth();
      return false;
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const checkAndRefresh = async () => {
      if (!isLoggedIn()) {
        if (requireAuth && onAuthFailure) {
          onAuthFailure();
        }
        return;
      }

      if (isTokenExpired() || isTokenExpiringSoon()) {
        const success = await doRefresh();
        if (!success && requireAuth && onAuthFailure) {
          onAuthFailure();
        }
      }
    };

    // Initial check
    checkAndRefresh();

    // Periodic check
    const interval = setInterval(checkAndRefresh, CHECK_INTERVAL);

    // Subscribe to auth events from other tabs
    const unsubscribe = subscribeAuthEvents(({ type }) => {
      if (type === 'logout' && requireAuth && onAuthFailure) {
        onAuthFailure();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [enabled, doRefresh, requireAuth, onAuthFailure]);

  return { refresh: doRefresh };
}

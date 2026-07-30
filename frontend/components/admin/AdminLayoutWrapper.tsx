'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { isAdmin, isLoggedIn, isTokenExpired, isTokenExpiringSoon, clearAuth } from '@/lib/auth';
import { ensureTokenRefreshed } from '@/lib/api-client';
import { useTokenRefresh } from '@/hooks/use-token-refresh';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayoutWrapper({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const handleAuthFailure = useCallback(() => {
    clearAuth();
    router.replace('/admin/login');
  }, [router]);

  useTokenRefresh({ enabled: authorized, requireAuth: true, onAuthFailure: handleAuthFailure });

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      if (!isLoggedIn() || !isAdmin()) {
        if (!cancelled) router.replace('/admin/login');
        return;
      }

      if (isTokenExpired() || isTokenExpiringSoon()) {
        try {
          await ensureTokenRefreshed();
        } catch {
          clearAuth();
          if (!cancelled) router.replace('/admin/login');
          return;
        }
      }

      if (!cancelled) setAuthorized(true);
    }

    initAuth();

    return () => { cancelled = true; };
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="lg:ml-64">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

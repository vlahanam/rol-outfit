'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { isAdmin, isLoggedIn, subscribeAuthEvents } from '@/lib/auth';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayoutWrapper({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) {
      router.replace('/admin/login');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  // Sync logout across tabs — when another tab clears auth, redirect here too
  useEffect(() => {
    const unsubscribe = subscribeAuthEvents(({ type }) => {
      if (type === 'logout') {
        router.replace('/admin/login');
      }
    });
    return unsubscribe;
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

'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { Header } from './Header';
import { MobileSidebar } from './MobileSidebar';
import { Footer } from './Footer';
import { CartProvider, useCart } from '@/context/cart-context';
import { isLoggedIn, subscribeAuthEvents } from '@/lib/auth';
import { api } from '@/lib/api';
import type { ApiResponse, User } from '@/types/api';

function LayoutContent({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { clearCart } = useCart();
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null);

  useEffect(() => {
    if (isLoggedIn()) {
      api
        .get<ApiResponse<User>>('/users/me')
        .then((res) => setUser({ full_name: res.data.full_name, email: res.data.email }))
        .catch(() => setUser(null));
    }

    const unsub = subscribeAuthEvents((event) => {
      if (event.type === 'logout') {
        setUser(null);
      } else if (event.type === 'tokens-updated' && isLoggedIn()) {
        api
          .get<ApiResponse<User>>('/users/me')
          .then((res) => setUser({ full_name: res.data.full_name, email: res.data.email }))
          .catch(() => setUser(null));
      }
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    await api.auth.logout();
    setUser(null);
    clearCart();
    router.push('/');
  };

  const handleSwitchLocale = () => {
    const locales = routing.locales as readonly string[];
    const nextLocale = locales.find((l) => l !== locale) ?? routing.defaultLocale;
    router.replace(pathname, { locale: nextLocale });
  };

  const handleChangeLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        onMenuClick={() => setIsSidebarOpen(true)}
        user={user}
        onLogout={handleLogout}
        onSwitchLocale={handleSwitchLocale}
      />
      <div className="h-[73px]" />
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
        locale={locale}
        onChangeLocale={handleChangeLocale}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <LayoutContent>{children}</LayoutContent>
    </CartProvider>
  );
}

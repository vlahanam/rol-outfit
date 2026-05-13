'use client';

import { useState, type ReactNode } from 'react';
import { Header } from './Header';
import { MobileSidebar } from './MobileSidebar';
import { CartProvider } from '@/context/cart-context';

export function MainLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <CartProvider>
      <div className="min-h-screen bg-white overflow-x-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <MobileSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        {children}
      </div>
    </CartProvider>
  );
}

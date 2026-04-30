'use client';

import { Search, ShoppingCart, User, Menu } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <button className="lg:hidden" onClick={onMenuClick}>
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/">
              <h1 className="text-2xl font-bold text-blue-600">RolOutfit</h1>
            </Link>
            <nav className="hidden lg:flex items-center gap-6">
              <Link href="/shop" className="text-gray-700 hover:text-blue-600 transition-colors">Cửa Hàng</Link>
              <Link href="/new-arrivals" className="text-gray-700 hover:text-blue-600 transition-colors">Hàng Mới</Link>
            </nav>
          </div>

          <div className="hidden md:flex flex-1 max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="md:hidden">
              <Search className="w-6 h-6 text-gray-700" />
            </button>
            <Link href="/cart" className="relative">
              <ShoppingCart className="w-6 h-6 text-gray-700 hover:text-blue-600 transition-colors" />
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                2
              </span>
            </Link>
            <Link href="/login">
              <User className="w-6 h-6 text-gray-700 hover:text-blue-600 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

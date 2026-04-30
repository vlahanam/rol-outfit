'use client';

import { X } from 'lucide-react';
import Link from 'next/link';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`fixed top-0 left-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-blue-600">RolOutfit</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/shop"
                onClick={onClose}
                className="w-full text-left block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
              >
                Cửa Hàng
              </Link>
            </li>
            <li>
              <Link
                href="/new-arrivals"
                onClick={onClose}
                className="w-full text-left block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
              >
                Hàng Mới
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 absolute bottom-0 w-full">
          <div className="space-y-2">
            <Link
              href="/login"
              onClick={onClose}
              className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Đăng Nhập
            </Link>
            <Link
              href="/register"
              onClick={onClose}
              className="w-full block text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Đăng Ký
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

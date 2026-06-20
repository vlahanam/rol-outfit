"use client";

import Image from "next/image";
import { ShoppingCart, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/context/cart-context";
import { UserDropdown } from "./user-dropdown";
import { SearchDropdown } from "./search-dropdown";

interface HeaderProps {
  onMenuClick: () => void;
  user: { full_name: string; email: string } | null;
  onLogout: () => void;
  onSwitchLocale: () => void;
}

export function Header({ onMenuClick, user, onLogout, onSwitchLocale }: HeaderProps) {
  const t = useTranslations("Header");
  const { cartCount } = useCart();

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <button className="lg:hidden" onClick={onMenuClick}>
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/logo.png"
                alt="RolOutfit"
                width={48}
                height={48}
                className="h-10 w-auto lg:h-12 rounded-lg"
                priority
              />
              <span className="text-xl font-bold text-blue-600 lg:text-2xl">RolOutfit</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-6">
              <Link
                href="/shop"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                {t("shop")}
              </Link>
              <Link
                href="/new-arrivals"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                {t("newArrivals")}
              </Link>
              <Link
                href="/shop?type=japanese"
                className="text-gray-700 hover:text-red-600 transition-colors"
              >
                {t("japaneseProducts")}
              </Link>
              <Link
                href="/shop?type=vietnamese"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                {t("vietnameseProducts")}
              </Link>
            </nav>
          </div>

          <div className="hidden md:flex flex-1 max-w-2xl">
            <SearchDropdown />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onSwitchLocale}
              className="hidden md:block text-sm font-medium px-2 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t("switchLang")}
            </button>
            <Link href="/cart" className="relative" id="cart-icon">
              <ShoppingCart className="w-6 h-6 text-gray-700 hover:text-blue-600 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
            <div className="hidden md:block">
              <UserDropdown user={user} onLogout={onLogout} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

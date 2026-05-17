"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { useCart } from "@/context/cart-context";
import { isLoggedIn, subscribeAuthEvents } from "@/lib/auth";
import { api } from "@/lib/api";
import { UserDropdown } from "./user-dropdown";
import type { ApiResponse, User } from "@/types/api";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const t = useTranslations("Header");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { cartCount, clearCart } = useCart();
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null);

  useEffect(() => {
    if (isLoggedIn()) {
      api
        .get<ApiResponse<User>>("/users/me")
        .then((res) => setUser({ full_name: res.data.full_name, email: res.data.email }))
        .catch(() => setUser(null));
    }

    const unsub = subscribeAuthEvents((event) => {
      if (event.type === "logout") {
        setUser(null);
      } else if (event.type === "tokens-updated" && isLoggedIn()) {
        api
          .get<ApiResponse<User>>("/users/me")
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
    router.push("/");
  };

  function switchLocale() {
    const locales = routing.locales as readonly string[];
    const nextLocale =
      locales.find((l) => l !== locale) ?? routing.defaultLocale;
    router.replace(pathname, { locale: nextLocale });
  }

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
            </nav>
          </div>

          <div className="hidden md:flex flex-1 max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={switchLocale}
              className="text-sm font-medium px-2 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t("switchLang")}
            </button>
            <button className="md:hidden">
              <Search className="w-6 h-6 text-gray-700" />
            </button>
            <Link href="/cart" className="relative" id="cart-icon">
              <ShoppingCart className="w-6 h-6 text-gray-700 hover:text-blue-600 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
            <UserDropdown user={user} onLogout={handleLogout} />
          </div>
        </div>
      </div>
    </header>
  );
}

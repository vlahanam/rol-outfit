"use client";

import { useState } from "react";
import { X, Search, User, Package, MapPin, LogOut, Globe, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: { full_name: string; email: string } | null;
  onLogout: () => void;
  locale: string;
  onChangeLocale: (locale: string) => void;
}

const LANGUAGES = [
  { code: "vn", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "jp", label: "日本語", flag: "🇯🇵" },
];

export function MobileSidebar({
  isOpen,
  onClose,
  user,
  onLogout,
  locale,
  onChangeLocale,
}: MobileSidebarProps) {
  const t = useTranslations("MobileSidebar");
  const [langOpen, setLangOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 lg:hidden flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-blue-600">RolOutfit</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <Link
                href="/shop"
                onClick={onClose}
                className="w-full text-left block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
              >
                {t("shop")}
              </Link>
            </li>
            <li>
              <Link
                href="/new-arrivals"
                onClick={onClose}
                className="w-full text-left block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
              >
                {t("newArrivals")}
              </Link>
            </li>
          </ul>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
            >
              <span className="flex items-center gap-3">
                <Globe className="w-5 h-5" />
                {t("language")}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-sm">{currentLang.flag} {currentLang.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </span>
            </button>
            {langOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onChangeLocale(lang.code);
                      setLangOpen(false);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      locale === lang.code
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          {user ? (
            <div>
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
              >
                <span className="flex items-center gap-3">
                  <User className="w-5 h-5" />
                  {t("account")}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 truncate max-w-[100px]">{user.full_name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${accountOpen ? "rotate-180" : ""}`} />
                </span>
              </button>
              {accountOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  <div className="px-4 py-2 bg-gray-50 rounded-lg mb-2">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    {t("myProfile")}
                  </Link>
                  <Link
                    href="/orders"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    {t("myOrders")}
                  </Link>
                  <Link
                    href="/addresses"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    {t("myAddresses")}
                  </Link>
                  <button
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                onClick={onClose}
                className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="w-full block text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t("register")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

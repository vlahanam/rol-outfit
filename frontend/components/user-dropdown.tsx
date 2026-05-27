"use client";

import { useState, useRef, useEffect } from "react";
import { User, Package, MapPin, LogOut, ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface Props {
  user: { full_name: string; email: string } | null;
  onLogout: () => void;
}

export function UserDropdown({ user, onLogout }: Props) {
  const t = useTranslations("Header");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) {
    return (
      <Link href="/login">
        <User className="w-6 h-6 text-gray-700 hover:text-blue-600 transition-colors" />
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors"
      >
        <User className="w-6 h-6" />
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="font-medium text-sm text-gray-900 truncate">
              {user.full_name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <Link
            href="/orders"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Package className="w-4 h-4" />
            {t("myOrders")}
          </Link>
          <Link
            href="/addresses"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <MapPin className="w-4 h-4" />
            {t("myAddresses")}
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { products } from "@/lib/api-resources";
import type { Product } from "@/types/api";
import { formatPrice, getFirstImageUrl } from "@/lib/format";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function SearchDropdown() {
  const t = useTranslations("Header");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query.trim(), 300);

  useEffect(() => {
    const doSearch = async () => {
      if (!debouncedQuery) {
        setResults([]);
        setOpen(false);
        setSearched(false);
        return;
      }
      setLoading(true);
      setSearched(true);
      try {
        const res = await products.search(debouncedQuery, 6);
        setResults(res.data ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    doSearch();
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = () => {
    setOpen(false);
    setQuery("");
    setSearched(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={t("searchPlaceholder")}
        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
      )}

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              onClick={handleSelect}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
            >
              {(getFirstImageUrl(product.images) ?? product.avatar) && (
                <Image
                  src={getFirstImageUrl(product.images) ?? product.avatar ?? ""}
                  alt={product.name}
                  width={48}
                  height={48}
                  unoptimized
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{product.name}</p>
                <p className="text-sm text-blue-600">
                  {formatPrice(
                    product.sale_price > 0 ? product.sale_price : product.default_price,
                    product.product_type
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {open && searched && !loading && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500">
          {t("noResults")}
        </div>
      )}
    </div>
  );
}

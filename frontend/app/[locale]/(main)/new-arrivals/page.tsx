"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { ProductItem } from "@/components/ProductItem";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import type { ApiResponse, Product } from "@/types/api";

function formatPrice(value: number): string {
  return value.toLocaleString("vi-VN") + "₫";
}

function effectivePrice(p: Product): number {
  return p.sale_price ?? p.default_price;
}

export default function NewArrivalsPage() {
  const t = useTranslations("NewArrivalsPage");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [sortBy, setSortBy] = useState("newest");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    api
      .get<ApiResponse<Product[]>>("/products?tag=new&limit=50")
      .then((res) => setProducts(res.data ?? []))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...products].sort((a, b) => {
    if (sortBy === "price-low") return effectivePrice(a) - effectivePrice(b);
    if (sortBy === "price-high") return effectivePrice(b) - effectivePrice(a);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{tCommon("backToHome")}</span>
        </Link>

        <div className="mb-8">
          <div className="inline-block bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full mb-3">
            {t("badge")}
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <p className="text-gray-600">
            {t("showing")}{" "}
            <span className="font-semibold">{sorted.length}</span>{" "}
            {t("newProducts")}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">{t("sortNewest")}</option>
            <option value="price-low">{t("sortPriceLow")}</option>
            <option value="price-high">{t("sortPriceHigh")}</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            {tCommon("loading")}
          </div>
        ) : fetchError ? (
          <div className="text-center py-12 text-red-500">
            {tCommon("errorLoading")}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t("noProducts")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {sorted.map((product) => (
              <div
                key={product.id}
                onClick={() => router.push(`/product/${product.id}`)}
                className="cursor-pointer"
              >
                <ProductItem
                  name={product.name}
                  price={formatPrice(effectivePrice(product))}
                  originalPrice={
                    product.sale_price != null &&
                    product.sale_price < product.default_price
                      ? formatPrice(product.default_price)
                      : undefined
                  }
                  discountPercent={
                    product.discount_percent > 0 &&
                    product.sale_price != null &&
                    product.sale_price < product.default_price
                      ? Math.round(
                          (1 - product.sale_price / product.default_price) * 100
                        )
                      : undefined
                  }
                  image={product.avatar}
                  tags={product.tags}
                  maxTags={2}
                />
              </div>
            ))}
          </div>
        )}
      </div>
  );
}

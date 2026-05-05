"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { ProductItem } from "@/components/ProductItem";
import { Footer } from "@/components/Footer";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import type { ApiResponse, Product, Category } from "@/types/api";

function formatPrice(value: number): string {
  return value.toLocaleString("vi-VN") + "₫";
}

export default function ShopPage() {
  const t = useTranslations("ShopPage");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get<ApiResponse<Product[]>>("/products?limit=50"),
          api.get<ApiResponse<Category[]>>("/categories?limit=50"),
        ]);
        setProducts(prodRes.data ?? []);
        setCategories(catRes.data ?? []);
      } catch {
        // keep empty lists on error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = products
    .filter((p) => !selectedCategory || p.category_id === selectedCategory)
    .sort((a, b) => {
      if (sortBy === "price-low") return a.default_price - b.default_price;
      if (sortBy === "price-high") return b.default_price - a.default_price;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{tCommon("backToHome")}</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === ""
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t("all")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

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

        <div className="mb-4">
          <p className="text-gray-600">
            {t("showing")}{" "}
            <span className="font-semibold">{filtered.length}</span>{" "}
            {t("products")}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            {tCommon("loading")}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filtered.map((product) => (
              <div
                key={product.id}
                onClick={() => router.push(`/product/${product.id}`)}
                className="cursor-pointer"
              >
                <ProductItem
                  name={product.name}
                  price={formatPrice(product.default_price)}
                  image={
                    product.avatar ||
                    "https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
                  }
                />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t("noProducts")}</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

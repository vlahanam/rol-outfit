"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { ProductItem } from "@/components/ProductItem";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import type { ApiResponse, Product, Category, Tag } from "@/types/api";
import { formatPrice, PRODUCT_TYPE_JAPANESE, PRODUCT_TYPE_VIETNAMESE, getFirstImageUrl } from "@/lib/format";

function effectivePrice(p: Product): number {
  return p.sale_price ?? p.default_price;
}

export default function ShopPage() {
  const t = useTranslations("ShopPage");
  const tHeader = useTranslations("Header");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");

  const productTypeFilter = typeParam === "japanese" ? PRODUCT_TYPE_JAPANESE
    : typeParam === "vietnamese" ? PRODUCT_TYPE_VIETNAMESE
    : 0;

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async (tagSlugs: string[], productType: number) => {
    try {
      let url = "/products?limit=50";
      if (tagSlugs.length > 0) {
        url += `&tags=${tagSlugs.join(",")}`;
      }
      if (productType > 0) {
        url += `&product_type=${productType}`;
      }
      const res = await api.get<ApiResponse<Product[]>>(url, locale);
      setProducts(res.data ?? []);
    } catch {
      setProducts([]);
    }
  }, [locale]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        let productUrl = "/products?limit=50";
        if (productTypeFilter > 0) {
          productUrl += `&product_type=${productTypeFilter}`;
        }
        const [prodRes, catRes, tagRes] = await Promise.all([
          api.get<ApiResponse<Product[]>>(productUrl, locale),
          api.get<ApiResponse<Category[]>>("/categories?limit=50", locale),
          api.get<ApiResponse<Tag[]>>("/tags?limit=50", locale),
        ]);
        setProducts(prodRes.data ?? []);
        setCategories(catRes.data ?? []);
        setTags(tagRes.data ?? []);
      } catch {
        // keep empty lists on error
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [locale, productTypeFilter]);

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug];
      fetchProducts(next, productTypeFilter);
      return next;
    });
  };

  const clearTags = () => {
    setSelectedTags([]);
    fetchProducts([], productTypeFilter);
  };

  const isOnSale = (p: Product) =>
    p.sale_price != null && p.sale_price < p.default_price;

  const filtered = products
    .filter((p) => !selectedCategory || p.category_id === selectedCategory)
    .filter((p) => sortBy !== "on-sale" || isOnSale(p))
    .sort((a, b) => {
      if (sortBy === "on-sale") {
        const discA = a.default_price - (a.sale_price ?? a.default_price);
        const discB = b.default_price - (b.sale_price ?? b.default_price);
        return discB - discA;
      }
      if (sortBy === "price-low") return effectivePrice(a) - effectivePrice(b);
      if (sortBy === "price-high") return effectivePrice(b) - effectivePrice(a);
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
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
          <h1 className="text-3xl font-bold mb-2">
            {productTypeFilter === PRODUCT_TYPE_JAPANESE
              ? tHeader("japaneseProducts")
              : productTypeFilter === PRODUCT_TYPE_VIETNAMESE
              ? tHeader("vietnameseProducts")
              : t("title")}
          </h1>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          {/* Category filter */}
          <div className="flex flex-col md:flex-row gap-4">
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
              <option value="on-sale">{t("filterOnSale")}</option>
            </select>
          </div>

          {/* Tag filter */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-500 mr-1">{t("filterByTag")}:</span>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.slug)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    selectedTags.includes(tag.slug)
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={clearTags}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  {t("clearTags")}
                </button>
              )}
            </div>
          )}
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
                onClick={() => router.push(`/product/${product.slug}`)}
                className="cursor-pointer"
              >
                <ProductItem
                  name={product.name}
                  price={formatPrice(effectivePrice(product), product.product_type)}
                  originalPrice={
                    product.sale_price < product.default_price
                      ? formatPrice(product.default_price, product.product_type)
                      : undefined
                  }
                  discountPercent={
                    product.discount_percent > 0 && product.sale_price < product.default_price
                      ? Math.round((1 - product.sale_price / product.default_price) * 100)
                      : undefined
                  }
                  image={getFirstImageUrl(product.images) ?? product.avatar}
                  tags={product.tags}
                  maxTags={2}
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
  );
}

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { products as productsApi } from "@/lib/api-resources";
import { ProductItem } from "@/components/ProductItem";
import { formatPrice, getFirstImageUrl } from "@/lib/format";
import type { Product } from "@/types/api";

interface RelatedProductsSectionProps {
  categoryId: string;
  excludeProductId: string;
}

export function RelatedProductsSection({
  categoryId,
  excludeProductId,
}: RelatedProductsSectionProps) {
  const t = useTranslations("ProductDetailPage");
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      return;
    }

    productsApi
      .listByCategory(categoryId, 9)
      .then((res) => {
        const filtered = (res.data ?? [])
          .filter((p) => p.id !== excludeProductId)
          .slice(0, 8);
        setRelatedProducts(filtered);
      })
      .catch(() => setRelatedProducts([]))
      .finally(() => setLoading(false));
  }, [categoryId, excludeProductId]);

  if (loading || relatedProducts.length === 0) return null;

  return (
    <section className="border-t border-gray-200 pt-8 mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        {t("relatedProducts")}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {relatedProducts.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`}>
            <ProductItem
              name={product.name}
              price={formatPrice(
                product.sale_price ?? product.default_price,
                product.product_type,
              )}
              originalPrice={
                product.sale_price < product.default_price
                  ? formatPrice(product.default_price, product.product_type)
                  : undefined
              }
              discountPercent={
                product.discount_percent > 0 &&
                product.sale_price < product.default_price
                  ? Math.round(
                      (1 - product.sale_price / product.default_price) * 100,
                    )
                  : undefined
              }
              image={getFirstImageUrl(product.images) ?? product.avatar}
              tags={product.tags}
              maxTags={1}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

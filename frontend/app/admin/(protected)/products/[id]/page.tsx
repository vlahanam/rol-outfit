"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ProductInfoPanel } from "@/components/admin/product-info-panel";
import { ProductAttrNamesPanel } from "@/components/admin/product-attr-names-panel";
import { ProductVariantsTable } from "@/components/admin/product-variants-table";
import { ProductTagsPanel } from "@/components/admin/product-tags-panel";
import type { ApiResponse, AdminProduct, Category, ProductVariant, Tag } from "@/types/api";

export default function AdminProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.adminProducts.get(id),
          api.get<ApiResponse<Category[]>>("/categories?limit=50"),
        ]);
        setProduct(prodRes.data);
        setCategories(catRes.data ?? []);
      } catch {
        setError("Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleInfoSaved = (updates: Partial<AdminProduct>) =>
    setProduct((prev) => (prev ? { ...prev, ...updates } : prev));

  const handleAttrNamesSaved = (names: string[]) =>
    setProduct((prev) => (prev ? { ...prev, attribute_names: names } : prev));

  const handleTagsSaved = (tags: Tag[]) =>
    setProduct((prev) => (prev ? { ...prev, tags } : prev));

  const handleVariantAdded = (v: ProductVariant) =>
    setProduct((prev) =>
      prev
        ? { ...prev, variants: [...prev.variants, v], variant_count: prev.variant_count + 1 }
        : prev,
    );

  const handleVariantDeleted = (variantId: string) =>
    setProduct((prev) =>
      prev
        ? {
            ...prev,
            variants: prev.variants.filter((v) => v.id !== variantId),
            variant_count: prev.variant_count - 1,
          }
        : prev,
    );

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  }
  if (error || !product) {
    return (
      <div className="p-8 text-center text-red-500">
        {error ?? "Không tìm thấy sản phẩm"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chi Tiết Sản Phẩm</h1>
          <p className="text-gray-500 text-sm font-mono">#{id}</p>
        </div>
      </div>

      <ProductInfoPanel
        product={product}
        categories={categories}
        onSaved={handleInfoSaved}
      />

      <ProductAttrNamesPanel
        productId={id}
        attrNames={product.attribute_names ?? []}
        onSaved={handleAttrNamesSaved}
      />

      <ProductTagsPanel
        productId={id}
        currentTags={product.tags ?? []}
        onSaved={handleTagsSaved}
      />

      <ProductVariantsTable
        product={product}
        onVariantAdded={handleVariantAdded}
        onVariantDeleted={handleVariantDeleted}
      />
    </div>
  );
}

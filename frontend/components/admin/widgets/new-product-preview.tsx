"use client";

import { useEffect, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { api } from "@/lib/api";
import { ProductItem } from "@/components/ProductItem";
import type { Product, Tag } from "@/types/api";

type DeviceMode = "desktop" | "mobile";

interface Props {
  tagIds: string[];
  quantity: number;
  columns: number;
}

export function NewProductPreview({ tagIds, quantity, columns }: Props) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [products, setProducts] = useState<Product[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.adminTags.listAll().then((res) => setTags(res.data));
  }, []);

  useEffect(() => {
    if (tagIds.length === 0 || tags.length === 0) {
      setProducts([]);
      return;
    }

    const slugs = tagIds
      .map((id) => tags.find((t) => t.id === id)?.slug)
      .filter(Boolean) as string[];

    if (slugs.length === 0) return;

    setLoading(true);
    api.products
      .listByTags({ tags: slugs, limit: quantity })
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [tagIds, quantity, tags]);

  const isMobile = deviceMode === "mobile";
  const gridCols = isMobile ? 2 : columns;

  if (tagIds.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 text-sm">
        Chon it nhat 1 tag de xem preview
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Preview ({products.length} san pham)
        </p>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setDeviceMode("desktop")}
            className={`p-1.5 rounded transition-colors ${
              !isMobile ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode("mobile")}
            className={`p-1.5 rounded transition-colors ${
              isMobile ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500 text-sm">Dang tai san pham...</div>
      ) : products.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 text-sm">
          Khong co san pham nao voi tags da chon
        </div>
      ) : (
        <div
          className="grid gap-4 p-4 bg-gray-50 rounded-lg"
          style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
        >
          {products.slice(0, quantity).map((p) => (
            <ProductItem
              key={p.id}
              name={p.name}
              price={`${p.sale_price.toLocaleString()}d`}
              originalPrice={p.discount_percent > 0 ? `${p.default_price.toLocaleString()}d` : undefined}
              discountPercent={p.discount_percent > 0 ? p.discount_percent : undefined}
              image={p.avatar || "/placeholder-product.svg"}
              isNew
            />
          ))}
        </div>
      )}
    </div>
  );
}

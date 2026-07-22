"use client";

import Image from "next/image";
import { ImageIcon, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AdminProduct } from "@/types/api";
import { formatPrice } from "@/lib/format";

type Props = {
  product: AdminProduct;
  onDeleteVariant: (variantId: string) => void;
};

function stockBadge(stock: number) {
  if (stock === 0) return { label: "Hết hàng", cls: "bg-red-100 text-red-700" };
  if (stock <= 20) return { label: "Sắp hết", cls: "bg-yellow-100 text-yellow-700" };
  return { label: "Còn hàng", cls: "bg-green-100 text-green-700" };
}

function VariantAvatarCell({ src }: { src?: string }) {
  if (!src)
    return (
      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
        <ImageIcon className="w-4 h-4 text-gray-400" />
      </div>
    );
  return (
    <div className="relative w-10 h-10 rounded overflow-hidden border border-gray-200">
      <Image src={src} alt="variant" fill unoptimized className="object-cover" />
    </div>
  );
}

export function ProductListVariantsTable({ product, onDeleteVariant }: Props) {
  const router = useRouter();

  return (
    <div className="ml-16 px-6 py-4 bg-gray-50">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">
        Biến Thể Sản Phẩm
      </h4>
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap">SKU</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Ảnh</th>
              {product.attribute_names.map((attr) => (
                <th key={attr} className="px-4 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap capitalize">
                  {attr}
                </th>
              ))}
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Giá</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Tồn Kho</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Đã Bán</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Trạng Thái</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {product.variants.map((variant) => {
              const badge = stockBadge(variant.stock);
              return (
                <tr key={variant.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-500 font-mono whitespace-nowrap">
                    {variant.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <VariantAvatarCell src={variant.avatar} />
                  </td>
                  {product.attribute_names.map((attr) => (
                    <td key={attr} className="px-4 py-2 text-xs text-gray-900 whitespace-nowrap">
                      {variant.attributes?.[attr] ?? "—"}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-xs font-medium text-gray-900 whitespace-nowrap">
                    {formatPrice(variant.price, product.product_type)}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-900 whitespace-nowrap">{variant.stock}</td>
                  <td className="px-4 py-2 text-xs text-gray-600 whitespace-nowrap">{variant.sold}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => router.push(`/admin/products/${product.id}/variants/${variant.id}`)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa biến thể"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteVariant(variant.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa biến thể"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

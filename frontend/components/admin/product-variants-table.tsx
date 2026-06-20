"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { createVariantSchema } from "@/lib/validations";
import { ImageUploader } from "@/components/admin/image-uploader";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import type { AdminProduct, ProductVariant } from "@/types/api";
import { formatPrice } from "@/lib/format";

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

type Props = {
  product: AdminProduct;
  onVariantAdded: (v: ProductVariant) => void;
  onVariantDeleted: (id: string) => void;
};

function stockBadge(stock: number) {
  if (stock === 0) return { label: "Hết hàng", cls: "bg-red-100 text-red-700" };
  if (stock <= 20) return { label: "Sắp hết", cls: "bg-yellow-100 text-yellow-700" };
  return { label: "Còn hàng", cls: "bg-green-100 text-green-700" };
}

export function ProductVariantsTable({
  product,
  onVariantAdded,
  onVariantDeleted,
}: Props) {
  const router = useRouter();
  const attrNames = product.attribute_names ?? [];

  const [showAdd, setShowAdd] = useState(false);
  const [newVariant, setNewVariant] = useState<Record<string, string>>({});
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [addApiError, setAddApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openAdd = () => {
    const empty = Object.fromEntries([
      ...attrNames.map((k) => [k, ""]),
      ["price", ""],
      ["stock", ""],
      ["avatar", ""],
    ]);
    setNewVariant(empty);
    setAddErrors({});
    setAddApiError(null);
    setShowAdd(true);
  };

  const submitAdd = async () => {
    const schema = createVariantSchema(attrNames);
    const result = schema.safeParse(newVariant);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        if (i.path[0]) errs[i.path[0] as string] = i.message;
      });
      setAddErrors(errs);
      return;
    }
    setSaving(true);
    setAddApiError(null);
    try {
      const attrs = Object.fromEntries(attrNames.map((k) => [k, newVariant[k]]));
      const { data: created } = await api.adminProducts.createVariant(
        product.id,
        {
          attributes: attrs,
          price: Number(newVariant.price),
          stock: Number(newVariant.stock),
          avatar: newVariant.avatar || undefined,
        },
      );
      onVariantAdded(created);
      setShowAdd(false);
    } catch (err) {
      setAddApiError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.adminProducts.removeVariant(product.id, deleteId);
      onVariantDeleted(deleteId);
      setDeleteId(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Không thể xóa biến thể");
      setDeleteId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Biến Thể</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
        >
          <Plus className="w-4 h-4" /> Thêm biến thể
        </button>
      </div>

      {product.variants.length === 0 && !showAdd && (
        <p className="text-sm text-gray-400 italic">Chưa có biến thể nào.</p>
      )}

      {(product.variants.length > 0 || showAdd) && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead className="bg-gray-50">
              <tr>
                {attrNames.map((attr) => (
                  <th key={attr} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    {attr}
                  </th>
                ))}
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Ảnh</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Giá</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tồn Kho</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Đã Bán</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Trạng Thái</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {product.variants.map((v) => {
                const badge = stockBadge(v.stock);
                return (
                  <tr key={v.id} className="hover:bg-gray-50">
                    {attrNames.map((attr) => (
                      <td key={attr} className="px-4 py-2 whitespace-nowrap">
                        {v.attributes?.[attr] ?? "—"}
                      </td>
                    ))}
                    <td className="px-4 py-2 whitespace-nowrap">
                      <VariantAvatarCell src={v.avatar} />
                    </td>
                    <td className="px-4 py-2 font-medium whitespace-nowrap">
                      {formatPrice(v.price, product.product_type)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{v.stock}</td>
                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{v.sold}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/admin/products/${product.id}/variants/${v.id}`)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                          title="Chỉnh sửa biến thể"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(v.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Xóa biến thể"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Add row */}
              {showAdd && (
                <tr className="bg-blue-50">
                  {attrNames.map((attr) => (
                    <td key={attr} className="px-4 py-2">
                      <input
                        value={newVariant[attr] ?? ""}
                        onChange={(e) =>
                          setNewVariant((p) => ({ ...p, [attr]: e.target.value }))
                        }
                        placeholder={attr}
                        className={`w-full px-2 py-1 border ${addErrors[attr] ? "border-red-500" : "border-gray-300"} rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                      {addErrors[attr] && (
                        <p className="mt-0.5 text-xs text-red-600">{addErrors[attr]}</p>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    <ImageUploader
                      value={newVariant.avatar ?? ""}
                      onChange={(url) => setNewVariant((p) => ({ ...p, avatar: url }))}
                      label=""
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={newVariant.price ?? ""}
                      onChange={(e) =>
                        setNewVariant((p) => ({ ...p, price: e.target.value }))
                      }
                      placeholder="Giá"
                      type="number"
                      min="0"
                      className={`w-full px-2 py-1 border ${addErrors.price ? "border-red-500" : "border-gray-300"} rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    {addErrors.price && (
                      <p className="mt-0.5 text-xs text-red-600">{addErrors.price}</p>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={newVariant.stock ?? ""}
                      onChange={(e) =>
                        setNewVariant((p) => ({ ...p, stock: e.target.value }))
                      }
                      placeholder="Tồn kho"
                      type="number"
                      min="0"
                      className={`w-full px-2 py-1 border ${addErrors.stock ? "border-red-500" : "border-gray-300"} rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    {addErrors.stock && (
                      <p className="mt-0.5 text-xs text-red-600">{addErrors.stock}</p>
                    )}
                  </td>
                  <td className="px-4 py-2" />
                  <td className="px-4 py-2" />
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={submitAdd}
                        disabled={saving}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? "..." : "Lưu"}
                      </button>
                      <button
                        onClick={() => setShowAdd(false)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                    </div>
                    {addApiError && (
                      <p className="mt-1 text-xs text-red-600">{addApiError}</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleteError && (
        <p className="mt-3 text-sm text-red-600">{deleteError}</p>
      )}

      <DeleteConfirmModal
        isOpen={deleteId !== null}
        title="Xóa Biến Thể"
        message="Bạn có chắc chắn muốn xóa biến thể này? Hành động này không thể hoàn tác."
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

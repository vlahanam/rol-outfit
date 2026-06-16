"use client";

import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import { ImageUploader } from "@/components/admin/image-uploader";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { LanguageTabsForm } from "@/components/admin/language-tabs-form";
import type { AdminProduct, Category } from "@/types/api";

const STATUS_LABEL: Record<number, string> = { 1: "Hiển thị", 2: "Ẩn" };

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function fromDatetimeLocal(val: string): string | null {
  if (!val) return null;
  return new Date(val).toISOString();
}

type Props = {
  product: AdminProduct;
  categories: Category[];
  onSaved: (updates: Partial<AdminProduct>) => void;
};

export function ProductInfoPanel({ product, categories, onSaved }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: product.name,
    name_ja: product.name_ja ?? "",
    category_id: product.category_id,
    default_price: String(product.default_price),
    shipping_cost: String(product.shipping_cost ?? 0),
    description: product.description ?? "",
    description_ja: product.description_ja ?? "",
    status: String(product.status),
    avatar: product.avatar ?? "",
    discount_percent: String(product.discount_percent ?? 0),
    discount_start_at: toDatetimeLocal(product.discount_start_at ?? null),
    discount_end_at: toDatetimeLocal(product.discount_end_at ?? null),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "—";

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.adminProducts.update(product.id, {
        name: form.name,
        name_ja: form.name_ja || undefined,
        category_id: form.category_id,
        default_price: Number(form.default_price),
        shipping_cost: Number(form.shipping_cost) || 0,
        description: form.description,
        description_ja: form.description_ja || undefined,
        status: Number(form.status),
        avatar: form.avatar || undefined,
        discount_percent: Number(form.discount_percent) || 0,
        discount_start_at: fromDatetimeLocal(form.discount_start_at),
        discount_end_at: fromDatetimeLocal(form.discount_end_at),
      });
      onSaved({
        name: form.name,
        name_ja: form.name_ja || undefined,
        category_id: form.category_id,
        default_price: Number(form.default_price),
        shipping_cost: Number(form.shipping_cost) || 0,
        description: form.description,
        description_ja: form.description_ja || undefined,
        status: Number(form.status),
        avatar: form.avatar || undefined,
        discount_percent: Number(form.discount_percent) || 0,
        discount_start_at: fromDatetimeLocal(form.discount_start_at),
        discount_end_at: fromDatetimeLocal(form.discount_end_at),
      });
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi lưu");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (form.avatar && form.avatar !== (product.avatar ?? "")) {
      api.uploads
        .delete(form.avatar.split("/").pop()?.split("?")[0] ?? "")
        .catch(() => {});
    }
    setForm({
      name: product.name,
      name_ja: product.name_ja ?? "",
      category_id: product.category_id,
      default_price: String(product.default_price),
      shipping_cost: String(product.shipping_cost ?? 0),
      description: product.description ?? "",
      description_ja: product.description_ja ?? "",
      status: String(product.status),
      avatar: product.avatar ?? "",
      discount_percent: String(product.discount_percent ?? 0),
      discount_start_at: toDatetimeLocal(product.discount_start_at ?? null),
      discount_end_at: toDatetimeLocal(product.discount_end_at ?? null),
    });
    setEditMode(false);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Thông Tin Cơ Bản
        </h2>
        {editMode ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
            >
              <X className="w-4 h-4" /> Hủy
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
          >
            <Pencil className="w-4 h-4" /> Chỉnh sửa
          </button>
        )}
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-600">{error}</p>
      )}

      {editMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <ImageUploader
              value={form.avatar}
              onChange={(url) => setForm((p) => ({ ...p, avatar: url }))}
              label="Ảnh sản phẩm"
            />
          </div>
          <LanguageTabsForm
            viContent={
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <TiptapEditor
                    value={form.description}
                    onChange={(html) => setForm((p) => ({ ...p, description: html }))}
                  />
                </div>
              </div>
            }
            jaContent={
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品名 (Japanese name)</label>
                  <input
                    value={form.name_ja}
                    onChange={(e) => setForm((p) => ({ ...p, name_ja: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">説明 (Japanese description)</label>
                  <TiptapEditor
                    value={form.description_ja}
                    onChange={(html) => setForm((p) => ({ ...p, description_ja: html }))}
                  />
                </div>
              </div>
            }
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục
            </label>
            <select
              value={form.category_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, category_id: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá mặc định (₫)
            </label>
            <input
              value={form.default_price}
              type="number"
              min="0"
              onChange={(e) =>
                setForm((p) => ({ ...p, default_price: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phí vận chuyển (₫)
            </label>
            <input
              value={form.shipping_cost}
              type="number"
              min="0"
              onChange={(e) =>
                setForm((p) => ({ ...p, shipping_cost: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Hiển thị</option>
              <option value="2">Ẩn</option>
            </select>
          </div>
          <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Giảm giá</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phần trăm (%)</label>
                <input
                  type="number" min="0" max="100" step="0.01"
                  value={form.discount_percent}
                  onChange={(e) => setForm((p) => ({ ...p, discount_percent: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
                <input
                  type="datetime-local"
                  value={form.discount_start_at}
                  onChange={(e) => setForm((p) => ({ ...p, discount_start_at: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc</label>
                <input
                  type="datetime-local"
                  value={form.discount_end_at}
                  onChange={(e) => setForm((p) => ({ ...p, discount_end_at: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-6">
          {product.avatar && (
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={product.avatar}
                  alt={product.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            </div>
          )}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Tên sản phẩm:</span>
              <span className="font-medium ml-2">{product.name}</span>
            </div>
            <div>
              <span className="text-gray-500">Danh mục:</span>
              <span className="font-medium ml-2">
                {categoryName(product.category_id)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Giá mặc định:</span>
              <span className="font-medium ml-2">
                {product.default_price.toLocaleString("vi-VN")}₫
              </span>
            </div>
            <div>
              <span className="text-gray-500">Phí vận chuyển:</span>
              <span className="font-medium ml-2">
                {(product.shipping_cost ?? 0).toLocaleString("vi-VN")}₫
              </span>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái:</span>
              <span
                className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                  product.status === 1
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {STATUS_LABEL[product.status] ?? product.status}
              </span>
            </div>
            {product.discount_percent > 0 && (
              <div className="md:col-span-2">
                <span className="text-gray-500">Giảm giá:</span>
                <span className="ml-2 font-medium text-red-600">{product.discount_percent}%</span>
                {product.sale_price < product.default_price && (
                  <span className="ml-2 text-gray-500 text-xs">
                    → {product.sale_price.toLocaleString("vi-VN")}₫
                  </span>
                )}
                {(product.discount_start_at || product.discount_end_at) && (
                  <span className="ml-2 text-xs text-gray-400">
                    {product.discount_start_at ? new Date(product.discount_start_at).toLocaleString("vi-VN") : ""}
                    {" – "}
                    {product.discount_end_at ? new Date(product.discount_end_at).toLocaleString("vi-VN") : "∞"}
                  </span>
                )}
              </div>
            )}
            {product.description && (
              <div className="md:col-span-2">
                <span className="text-sm text-gray-500 block mb-1">Mô tả:</span>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

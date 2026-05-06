"use client";

import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { api } from "@/lib/api";
import type { AdminProduct, Category } from "@/types/api";

const STATUS_LABEL: Record<number, string> = { 1: "Hiển thị", 2: "Ẩn" };

type Props = {
  product: AdminProduct;
  categories: Category[];
  onSaved: (updates: Partial<AdminProduct>) => void;
};

export function ProductInfoPanel({ product, categories, onSaved }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: product.name,
    category_id: product.category_id,
    default_price: String(product.default_price),
    description: product.description ?? "",
    status: String(product.status),
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
        category_id: form.category_id,
        default_price: Number(form.default_price),
        description: form.description,
        status: Number(form.status),
      });
      onSaved({
        name: form.name,
        category_id: form.category_id,
        default_price: Number(form.default_price),
        description: form.description,
        status: Number(form.status),
      });
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi lưu");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: product.name,
      category_id: product.category_id,
      default_price: String(product.default_price),
      description: product.description ?? "",
      status: String(product.status),
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên sản phẩm
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
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
          {product.description && (
            <div className="md:col-span-2">
              <span className="text-gray-500">Mô tả:</span>
              <span className="ml-2">{product.description}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

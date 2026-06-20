"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ImageUploader } from "@/components/admin/image-uploader";
import type { AdminProduct, ProductVariant } from "@/types/api";
import { getCurrencyLabel } from "@/lib/format";

export default function EditVariantPage() {
  const router = useRouter();
  const { id, variantId } = useParams<{ id: string; variantId: string }>();

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [avatar, setAvatar] = useState("");
  const [status, setStatus] = useState("1");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [discountStartAt, setDiscountStartAt] = useState("");
  const [discountEndAt, setDiscountEndAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.adminProducts
      .get(id)
      .then((res) => {
        const p = res.data;
        const v = p.variants.find((x) => x.id === variantId);
        if (!v) { setLoadError("Không tìm thấy biến thể"); return; }
        setProduct(p);
        setVariant(v);
        setAttributes(v.attributes ?? {});
        setPrice(String(v.price));
        setStock(String(v.stock));
        setAvatar(v.avatar ?? "");
        setStatus(String(v.status));
        setDiscountPercent(String(v.discount_percent ?? 0));
        setDiscountStartAt(v.discount_start_at ? v.discount_start_at.slice(0, 16) : "");
        setDiscountEndAt(v.discount_end_at ? v.discount_end_at.slice(0, 16) : "");
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Lỗi tải dữ liệu"))
      .finally(() => setLoading(false));
  }, [id, variantId]);

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    const priceNum = Number(price);
    const stockNum = Number(stock);

    if (!price.trim() || Number.isNaN(priceNum) || priceNum < 0) errors.price = "Giá không hợp lệ";
    if (!stock.trim() || !Number.isInteger(stockNum) || stockNum < 0) errors.stock = "Tồn kho không hợp lệ";
    if (product) {
      for (const name of product.attribute_names) {
        if (!attributes[name]?.trim()) errors[name] = `Thuộc tính "${name}" không được trống`;
      }
    }
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});

    setSaving(true);
    setSaveError(null);
    try {
      await api.adminProducts.updateVariant(id, variantId, {
        attributes,
        price: priceNum,
        stock: stockNum,
        avatar: avatar || undefined,
        status: Number(status),
        discount_percent: Number(discountPercent) || 0,
        discount_start_at: discountStartAt ? new Date(discountStartAt).toISOString() : null,
        discount_end_at: discountEndAt ? new Date(discountEndAt).toISOString() : null,
      });
      router.push(`/admin/products/${id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Lỗi cập nhật biến thể");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  if (loadError || !product || !variant) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{loadError ?? "Không tìm thấy biến thể"}</p>
        <Link href={`/admin/products/${id}`} className="text-blue-600 hover:underline text-sm">
          ← Quay lại sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/products/${id}`} aria-label="Quay lại sản phẩm" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Biến Thể</h1>
          <p className="text-gray-600 text-sm">{product.name}</p>
        </div>
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {saveError}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <ImageUploader
          value={avatar}
          onChange={setAvatar}
          label="Ảnh biến thể"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.attribute_names.map((name) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {name}
              </label>
              <input
                value={attributes[name] ?? ""}
                onChange={(e) => {
                  setAttributes((p) => ({ ...p, [name]: e.target.value }));
                  setFieldErrors((p) => { const n = { ...p }; delete n[name]; return n; });
                }}
                className={`w-full px-3 py-2 border ${fieldErrors[name] ? "border-red-500" : "border-gray-300"} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {fieldErrors[name] && <p className="mt-1 text-xs text-red-600">{fieldErrors[name]}</p>}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá ({getCurrencyLabel(product?.product_type)})</label>
            <input
              value={price}
              type="number"
              min="0"
              onChange={(e) => { setPrice(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n.price; return n; }); }}
              className={`w-full px-3 py-2 border ${fieldErrors.price ? "border-red-500" : "border-gray-300"} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {fieldErrors.price && <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
            <input
              value={stock}
              type="number"
              min="0"
              step="1"
              onChange={(e) => { setStock(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n.stock; return n; }); }}
              className={`w-full px-3 py-2 border ${fieldErrors.stock ? "border-red-500" : "border-gray-300"} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {fieldErrors.stock && <p className="mt-1 text-xs text-red-600">{fieldErrors.stock}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Hiển thị</option>
              <option value="2">Ẩn</option>
            </select>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Giảm giá</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phần trăm giảm (%)</label>
              <input
                type="number" min="0" max="100" step="0.01"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
              <input
                type="datetime-local"
                value={discountStartAt}
                onChange={(e) => setDiscountStartAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc</label>
              <input
                type="datetime-local"
                value={discountEndAt}
                onChange={(e) => setDiscountEndAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
        <Link
          href={`/admin/products/${id}`}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Hủy
        </Link>
      </div>
    </div>
  );
}

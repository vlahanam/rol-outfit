"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addProductSchema, variantSchema } from "@/lib/validations";

type Attribute = { key: string; value: string };
type Variant = {
  color: string;
  size: string;
  price: string;
  stock: string;
  sku: string;
};

export default function AddProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [attributes, setAttributes] = useState<Attribute[]>([
    { key: "", value: "" },
  ]);
  const [variants, setVariants] = useState<Variant[]>([
    { color: "", size: "", price: "", stock: "", sku: "" },
  ]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [variantErrors, setVariantErrors] = useState<
    Record<number, Record<string, string>>
  >({});

  const addAttribute = () =>
    setAttributes((prev) => [...prev, { key: "", value: "" }]);
  const removeAttribute = (i: number) =>
    setAttributes((prev) => prev.filter((_, idx) => idx !== i));
  const updateAttribute = (
    i: number,
    field: keyof Attribute,
    value: string,
  ) => {
    setAttributes((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)),
    );
  };

  const addVariant = () =>
    setVariants((prev) => [
      ...prev,
      { color: "", size: "", price: "", stock: "", sku: "" },
    ]);
  const removeVariant = (i: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
    setVariantErrors((prev) => {
      const next = { ...prev };
      delete next[i];
      return next;
    });
  };
  const updateVariant = (i: number, field: keyof Variant, value: string) => {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)),
    );
    setVariantErrors((prev) => ({ ...prev, [i]: { ...prev[i], [field]: "" } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const productResult = addProductSchema.safeParse({
      name,
      category,
      description,
    });
    if (!productResult.success) {
      const errors: Record<string, string> = {};
      productResult.error.issues.forEach((issue) => {
        if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const newVariantErrors: Record<number, Record<string, string>> = {};
    let hasVariantError = false;
    variants.forEach((variant, i) => {
      const result = variantSchema.safeParse(variant);
      if (!result.success) {
        hasVariantError = true;
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
        });
        newVariantErrors[i] = errors;
      }
    });
    if (hasVariantError) {
      setVariantErrors(newVariantErrors);
      return;
    }
    setVariantErrors({});

    console.log("Add product:", {
      name,
      category,
      description,
      attributes,
      variants,
    });
    router.push("/admin/products");
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Thêm Sản Phẩm</h1>
          <p className="text-gray-600">Tạo sản phẩm mới</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Thông Tin Cơ Bản
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFieldErrors((p) => ({ ...p, name: "" }));
                }}
                type="text"
                placeholder="Áo Thun Cotton"
                className={`w-full px-3 py-2 border ${fieldErrors.name ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setFieldErrors((p) => ({ ...p, category: "" }));
                }}
                className={`w-full px-3 py-2 border ${fieldErrors.category ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Chọn danh mục</option>
                <option value="Áo">Áo</option>
                <option value="Quần">Quần</option>
                <option value="Giày">Giày</option>
                <option value="Phụ kiện">Phụ kiện</option>
              </select>
              {fieldErrors.category && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.category}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Mô tả chi tiết sản phẩm..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Thuộc Tính</h2>
            <button
              type="button"
              onClick={addAttribute}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" /> Thêm
            </button>
          </div>
          <div className="space-y-3">
            {attributes.map((attr, i) => (
              <div key={i} className="flex gap-3 items-center">
                <input
                  value={attr.key}
                  onChange={(e) => updateAttribute(i, "key", e.target.value)}
                  placeholder="Tên thuộc tính"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={attr.value}
                  onChange={(e) => updateAttribute(i, "value", e.target.value)}
                  placeholder="Giá trị"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeAttribute(i)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Biến Thể</h2>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" /> Thêm
            </button>
          </div>
          <div className="space-y-3">
            {variants.map((variant, i) => (
              <div
                key={i}
                className="p-3 border border-gray-200 rounded-lg space-y-2"
              >
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-start">
                  <div>
                    <input
                      value={variant.color}
                      onChange={(e) =>
                        updateVariant(i, "color", e.target.value)
                      }
                      placeholder="Màu sắc"
                      className={`w-full px-3 py-2 border ${variantErrors[i]?.color ? "border-red-500" : "border-gray-300"} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {variantErrors[i]?.color && (
                      <p className="mt-0.5 text-sm text-red-600">
                        {variantErrors[i].color}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      value={variant.size}
                      onChange={(e) => updateVariant(i, "size", e.target.value)}
                      placeholder="Size"
                      className={`w-full px-3 py-2 border ${variantErrors[i]?.size ? "border-red-500" : "border-gray-300"} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {variantErrors[i]?.size && (
                      <p className="mt-0.5 text-sm text-red-600">
                        {variantErrors[i].size}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      value={variant.price}
                      onChange={(e) =>
                        updateVariant(i, "price", e.target.value)
                      }
                      placeholder="Giá (₫)"
                      type="number"
                      className={`w-full px-3 py-2 border ${variantErrors[i]?.price ? "border-red-500" : "border-gray-300"} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {variantErrors[i]?.price && (
                      <p className="mt-0.5 text-sm text-red-600">
                        {variantErrors[i].price}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      value={variant.stock}
                      onChange={(e) =>
                        updateVariant(i, "stock", e.target.value)
                      }
                      placeholder="Tồn kho"
                      type="number"
                      className={`w-full px-3 py-2 border ${variantErrors[i]?.stock ? "border-red-500" : "border-gray-300"} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {variantErrors[i]?.stock && (
                      <p className="mt-0.5 text-sm text-red-600">
                        {variantErrors[i].stock}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                    <input
                      value={variant.sku}
                      onChange={(e) => updateVariant(i, "sku", e.target.value)}
                      placeholder="SKU"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Tạo Sản Phẩm
          </button>
          <Link
            href="/admin/products"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}

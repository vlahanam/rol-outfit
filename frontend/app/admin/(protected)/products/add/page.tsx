"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { addProductSchema, createVariantSchema } from "@/lib/validations";
import { ImageUploader } from "@/components/admin/image-uploader";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { LanguageTabsForm } from "@/components/admin/language-tabs-form";
import type { ApiResponse, Category } from "@/types/api";

type Variant = Record<string, string> & { price: string; stock: string };

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  // Basic info
  const [name, setName] = useState("");
  const [nameJa, setNameJa] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionJa, setDescriptionJa] = useState("");
  const [productAvatar, setProductAvatar] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Attribute names (defines variant columns)
  const [attributeNames, setAttributeNames] = useState<string[]>([]);
  const [newAttrInput, setNewAttrInput] = useState("");

  // Variants (dynamic fields)
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantErrors, setVariantErrors] = useState<
    Record<number, Record<string, string>>
  >({});

  // Discount
  const [discountPercent, setDiscountPercent] = useState("0");
  const [discountStartAt, setDiscountStartAt] = useState("");
  const [discountEndAt, setDiscountEndAt] = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ApiResponse<Category[]>>("/categories?limit=50")
      .then((res) => setCategories(res.data ?? []))
      .catch(() => {});
  }, []);

  // Attribute name management
  const addAttributeName = () => {
    const trimmed = newAttrInput.trim();
    if (!trimmed || attributeNames.includes(trimmed)) return;
    setAttributeNames((prev) => [...prev, trimmed]);
    setVariants((prev) => prev.map((v) => ({ ...v, [trimmed]: "" })));
    setNewAttrInput("");
  };

  const removeAttributeName = (name: string) => {
    setAttributeNames((prev) => prev.filter((a) => a !== name));
    setVariants((prev) =>
      prev.map((v) => {
        const next = { ...v };
        delete next[name];
        return next;
      }),
    );
  };

  // Variant management
  const addVariant = () => {
    const empty = Object.fromEntries([
      ...attributeNames.map((k) => [k, ""]),
      ["price", ""],
      ["stock", ""],
      ["avatar", ""],
    ]) as Variant;
    setVariants((prev) => [...prev, empty]);
  };

  const removeVariant = (i: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
    setVariantErrors((prev) => {
      const next: Record<number, Record<string, string>> = {};
      Object.entries(prev).forEach(([key, val]) => {
        const k = Number(key);
        if (k < i) next[k] = val;
        else if (k > i) next[k - 1] = val;
      });
      return next;
    });
  };

  const updateVariant = (i: number, field: string, value: string) => {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)),
    );
    setVariantErrors((prev) => ({
      ...prev,
      [i]: { ...prev[i], [field]: "" },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate product fields
    const productResult = addProductSchema.safeParse({
      name,
      category_id: categoryId,
      default_price: defaultPrice,
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
    if (!productAvatar) {
      setFieldErrors((p) => ({ ...p, avatar: "Vui lòng chọn ảnh sản phẩm" }));
      return;
    }
    setFieldErrors({});

    // Validate variants
    const varSchema = createVariantSchema(attributeNames);
    const newVariantErrors: Record<number, Record<string, string>> = {};
    let hasVariantError = false;
    variants.forEach((variant, i) => {
      const result = varSchema.safeParse(variant);
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

    setSubmitting(true);
    setSubmitError(null);
    try {
      const { data: created } = await api.adminProducts.create({
        name,
        name_ja: nameJa || undefined,
        category_id: categoryId,
        default_price: Number(defaultPrice),
        description,
        description_ja: descriptionJa || undefined,
        attribute_names: attributeNames,
        avatar: productAvatar,
        discount_percent: Number(discountPercent) || 0,
        discount_start_at: discountStartAt ? new Date(discountStartAt).toISOString() : null,
        discount_end_at: discountEndAt ? new Date(discountEndAt).toISOString() : null,
      });

      if (variants.length > 0) {
        const results = await Promise.allSettled(
          variants.map((v) => {
            const attrs = Object.fromEntries(
              attributeNames.map((k) => [k, v[k]]),
            );
            return api.adminProducts.createVariant(created.id, {
              attributes: attrs,
              price: Number(v.price),
              stock: Number(v.stock),
              avatar: v.avatar || undefined,
            });
          }),
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          // Redirect to edit page so admin can fix remaining variants
          router.push(
            `/admin/products/${created.id}?warn=${failed}_variants_failed`,
          );
          return;
        }
      }

      router.push("/admin/products");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
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

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Thông Tin Cơ Bản
          </h2>
          <ImageUploader
            value={productAvatar}
            onChange={(url) => {
              setProductAvatar(url);
              if (url) setFieldErrors((p) => { const n = { ...p }; delete n.avatar; return n; });
            }}
            required
            label="Ảnh sản phẩm"
            error={fieldErrors.avatar}
          />
          <LanguageTabsForm
            viContent={
              <div className="space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                  <TiptapEditor value={description} onChange={setDescription} />
                </div>
              </div>
            }
            jaContent={
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品名 (Japanese name)
                  </label>
                  <input
                    value={nameJa}
                    onChange={(e) => setNameJa(e.target.value)}
                    type="text"
                    placeholder="コットンTシャツ"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">説明 (Japanese description)</label>
                  <TiptapEditor value={descriptionJa} onChange={setDescriptionJa} />
                </div>
              </div>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setFieldErrors((p) => ({ ...p, category_id: "" }));
                }}
                className={`w-full px-3 py-2 border ${fieldErrors.category_id ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.category_id && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.category_id}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá mặc định (₫) <span className="text-red-500">*</span>
              </label>
              <input
                value={defaultPrice}
                onChange={(e) => {
                  setDefaultPrice(e.target.value);
                  setFieldErrors((p) => ({ ...p, default_price: "" }));
                }}
                type="number"
                min="0"
                placeholder="150000"
                className={`w-full px-3 py-2 border ${fieldErrors.default_price ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {fieldErrors.default_price && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.default_price}
                </p>
              )}
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

        {/* Attribute Names */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Tên Thuộc Tính Biến Thể
          </h2>
          <p className="text-sm text-gray-500">
            Định nghĩa các thuộc tính của biến thể (ví dụ: Size, Màu sắc).
            Thêm thuộc tính trước khi thêm biến thể.
          </p>
          <div className="flex gap-2 flex-wrap">
            {attributeNames.map((name) => (
              <span
                key={name}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeAttributeName(name)}
                  className="hover:text-blue-600 ml-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newAttrInput}
              onChange={(e) => setNewAttrInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAttributeName();
                }
              }}
              placeholder="Nhập tên thuộc tính (vd: Size, Màu sắc)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addAttributeName}
              className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
            >
              <Plus className="w-4 h-4" /> Thêm
            </button>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Biến Thể</h2>
            <button
              type="button"
              onClick={addVariant}
              disabled={attributeNames.length === 0}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Thêm
            </button>
          </div>

          {attributeNames.length === 0 && (
            <p className="text-sm text-gray-400 italic">
              Thêm thuộc tính trước khi thêm biến thể.
            </p>
          )}

          {variants.length > 0 && (
            <div className="space-y-3">
              {/* Column headers */}
              <div
                className="grid gap-3 text-xs font-medium text-gray-500 uppercase px-1"
                style={{
                  gridTemplateColumns: `repeat(${attributeNames.length + 2}, minmax(0, 1fr)) 5rem 2rem`,
                }}
              >
                {attributeNames.map((attr) => (
                  <span key={attr}>{attr}</span>
                ))}
                <span>Giá (₫)</span>
                <span>Tồn kho</span>
                <span>Ảnh</span>
                <span />
              </div>

              {variants.map((variant, i) => (
                <div
                  key={i}
                  className="grid gap-3 items-start"
                  style={{
                    gridTemplateColumns: `repeat(${attributeNames.length + 2}, minmax(0, 1fr)) 5rem 2rem`,
                  }}
                >
                  {attributeNames.map((attr) => (
                    <div key={attr}>
                      <input
                        value={variant[attr] ?? ""}
                        onChange={(e) => updateVariant(i, attr, e.target.value)}
                        placeholder={attr}
                        className={`w-full px-3 py-2 border ${variantErrors[i]?.[attr] ? "border-red-500" : "border-gray-300"} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {variantErrors[i]?.[attr] && (
                        <p className="mt-0.5 text-xs text-red-600">
                          {variantErrors[i][attr]}
                        </p>
                      )}
                    </div>
                  ))}
                  <div>
                    <input
                      value={variant.price}
                      onChange={(e) => updateVariant(i, "price", e.target.value)}
                      placeholder="Giá"
                      type="number"
                      min="0"
                      className={`w-full px-3 py-2 border ${variantErrors[i]?.price ? "border-red-500" : "border-gray-300"} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {variantErrors[i]?.price && (
                      <p className="mt-0.5 text-xs text-red-600">
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
                      min="0"
                      className={`w-full px-3 py-2 border ${variantErrors[i]?.stock ? "border-red-500" : "border-gray-300"} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {variantErrors[i]?.stock && (
                      <p className="mt-0.5 text-xs text-red-600">
                        {variantErrors[i].stock}
                      </p>
                    )}
                  </div>
                  <div>
                    <ImageUploader
                      value={variant.avatar ?? ""}
                      onChange={(url) => updateVariant(i, "avatar", url)}
                      label="Ảnh"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {submitting ? "Đang tạo..." : "Tạo Sản Phẩm"}
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

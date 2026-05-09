"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { addWidgetSchema } from "@/lib/validations";
import type { Widget, WidgetType } from "@/types/api";

const WIDGET_TYPES: { value: WidgetType; label: string }[] = [
  { value: "container", label: "Container" },
  { value: "image", label: "Hình ảnh" },
  { value: "chart", label: "Biểu đồ" },
  { value: "table", label: "Bảng" },
  { value: "stat", label: "Thống kê" },
  { value: "text", label: "Văn bản" },
];

export default function AddWidgetPage() {
  const router = useRouter();
  const [containers, setContainers] = useState<Widget[]>([]);
  const [form, setForm] = useState({
    name: "",
    type: "container" as WidgetType,
    display_order: 1,
    status: 2,
    parent_id: "",
    url_image: "",
    link: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.adminWidgets
      .list({ limit: 100 })
      .then((res) => setContainers((res.data ?? []).filter((w) => w.type === "container")));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    const result = addWidgetSchema.safeParse({
      name: form.name,
      type: form.type,
      display_order: form.display_order,
      status: form.status,
      parent_id: form.parent_id || undefined,
    });

    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) errs[issue.path[0] as string] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }

    const settings =
      form.type === "image" ? { url_image: form.url_image, link: form.link } : null;

    setSubmitting(true);
    try {
      await api.adminWidgets.create({
        name: result.data.name,
        type: result.data.type,
        display_order: result.data.display_order,
        status: result.data.status,
        parent_id: result.data.parent_id || null,
        settings,
      });
      router.push("/admin/widgets");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Thêm widget thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/widgets")}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thêm Widget</h1>
          <p className="text-gray-600 text-sm">Tạo widget mới cho trang chủ</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên Widget *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tên widget..."
          />
          {fieldErrors.name && <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại *</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as WidgetType }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {WIDGET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {fieldErrors.type && <p className="text-red-600 text-xs mt-1">{fieldErrors.type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thứ Tự *</label>
            <input
              type="number"
              min={0}
              value={form.display_order}
              onChange={(e) =>
                setForm((p) => ({ ...p, display_order: parseInt(e.target.value) || 0 }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldErrors.display_order && (
              <p className="text-red-600 text-xs mt-1">{fieldErrors.display_order}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng Thái *</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2}>Hiển thị</option>
              <option value={1}>Ẩn</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Widget Cha</label>
            <select
              value={form.parent_id}
              onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Không có —</option>
              {containers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.parent_id && (
              <p className="text-red-600 text-xs mt-1">{fieldErrors.parent_id}</p>
            )}
          </div>
        </div>

        {form.type === "image" && (
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700">Cài Đặt Hình Ảnh</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Hình Ảnh</label>
              <input
                type="text"
                value={form.url_image}
                onChange={(e) => setForm((p) => ({ ...p, url_image: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Liên Kết</label>
              <input
                type="text"
                value={form.link}
                onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/admin/widgets")}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Đang lưu..." : "Thêm Widget"}
          </button>
        </div>
      </form>
    </div>
  );
}

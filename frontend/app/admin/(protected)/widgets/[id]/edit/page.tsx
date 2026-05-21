"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { api, ApiError, WIDGET_TYPE_LABEL } from "@/lib/api";
import { BannerSliderEditor, defaultSlide } from "@/components/admin/widgets/banner-slider-editor";
import { BannerSliderPreview } from "@/components/admin/widgets/banner-slider-preview";
import type { WidgetType, BannerSlide, UpdateWidgetPayload } from "@/types/api";

export default function EditWidgetPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState({ name: "", type: "" as WidgetType, status: 2 });
  const [slides, setSlides] = useState<BannerSlide[]>([defaultSlide()]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    api.adminWidgets
      .get(id)
      .then((res) => {
        const w = res.data;
        setForm({ name: w.name, type: w.type as WidgetType, status: w.status });
        if (w.type === "banner-slider") {
          const meta = w.metadata as { slides?: unknown[] } | null;
          const existing = meta?.slides;
          // Spread defaultSlide() to backfill any fields missing in older stored data
          setSlides(
            Array.isArray(existing) && existing.length > 0
              ? existing.map((s) => ({ ...defaultSlide(), ...(s as Partial<BannerSlide>) }))
              : [defaultSlide()]
          );
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setError(null);

    if (form.name.trim().length < 2) {
      setNameError("Tên phải có ít nhất 2 ký tự");
      return;
    }

    if (form.type === "banner-slider") {
      const missingIdx = slides.findIndex((s) => !s.image);
      if (missingIdx !== -1) {
        setActiveSlide(missingIdx);
        setError(`Slide ${missingIdx + 1} chưa có ảnh`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: UpdateWidgetPayload = { name: form.name, status: form.status };
      if (form.type === "banner-slider") {
        payload.metadata = { slides };
      }
      await api.adminWidgets.update(id, payload);
      router.push("/admin/widgets");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Cập nhật thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500 text-sm">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/widgets")}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Widget</h1>
          <p className="text-gray-600 text-sm">Cập nhật thông tin widget</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-5 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên Widget *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {nameError && <p className="text-red-600 text-xs mt-1">{nameError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
            <p className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50">
              {WIDGET_TYPE_LABEL[form.type] ?? form.type}
            </p>
          </div>

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
        </div>

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
            {submitting ? "Đang lưu..." : "Lưu Thay Đổi"}
          </button>
        </div>
      </form>

      {form.type === "banner-slider" && (
        <div className="space-y-6">
          <BannerSliderPreview
            slides={slides}
            activeIndex={activeSlide}
            onActiveChange={setActiveSlide}
          />

          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 max-w-2xl">
            <h2 className="text-sm font-semibold text-gray-700">Nội Dung Slides</h2>
            <BannerSliderEditor
              slides={slides}
              onChange={setSlides}
              activeIndex={activeSlide}
              onActiveChange={setActiveSlide}
            />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { api, ApiError, WIDGET_TYPE_LABEL } from "@/lib/api";
import { BannerSliderEditor, defaultSlide } from "@/components/admin/widgets/banner-slider-editor";
import { BannerSliderPreview } from "@/components/admin/widgets/banner-slider-preview";
import { CollectionGridEditor, defaultCollectionItem } from "@/components/admin/widgets/collection-grid-editor";
import { CollectionGridPreview } from "@/components/admin/widgets/collection-grid-preview";
import { TrendHotEditor, defaultTrendHotItem } from "@/components/admin/widgets/trend-hot-editor";
import { TrendHotPreview } from "@/components/admin/widgets/trend-hot-preview";
import { FullPagePreviewModal } from "@/components/admin/widgets/full-page-preview-modal";
import { NewProductEditor } from "@/components/admin/widgets/new-product-editor";
import { NewProductPreview } from "@/components/admin/widgets/new-product-preview";
import type { WidgetType, BannerSlide, BannerSliderSettings, UpdateWidgetPayload, CollectionItem, CollectionGridMetadata, CollectionGridSettings, TrendHotSettings, NewProductMetadata, NewProductSettings } from "@/types/api";
import { Slider } from "@/components/ui/slider";
import { LanguageTabsForm } from "@/components/admin/language-tabs-form";

export default function EditWidgetPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState({ name: "", name_ja: "", type: "" as WidgetType, status: 2 });
  const [slides, setSlides] = useState<BannerSlide[]>([defaultSlide()]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [autoPlayInterval, setAutoPlayInterval] = useState(5); // seconds
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([defaultCollectionItem()]);
  const [activeCollectionItem, setActiveCollectionItem] = useState(0);
  const [cardHeight, setCardHeight] = useState(400);
  const [trendHotItems, setTrendHotItems] = useState<CollectionItem[]>([defaultTrendHotItem()]);
  const [activeTrendHotItem, setActiveTrendHotItem] = useState(0);
  const [trendHotCardHeight, setTrendHotCardHeight] = useState(400);
  const [showTrendHotBadge, setShowTrendHotBadge] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [newProductTagIds, setNewProductTagIds] = useState<string[]>([]);
  const [newProductQuantity, setNewProductQuantity] = useState(10);
  const [newProductColumns, setNewProductColumns] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    api.adminWidgets
      .get(id)
      .then((res) => {
        const w = res.data;
        setForm({ name: w.name, name_ja: w.name_ja ?? "", type: w.type as WidgetType, status: w.status });
        if (w.type === "banner-slider") {
          const meta = w.metadata as { slides?: unknown[] } | null;
          const existing = meta?.slides;
          // Spread defaultSlide() to backfill any fields missing in older stored data
          setSlides(
            Array.isArray(existing) && existing.length > 0
              ? existing.map((s) => ({ ...defaultSlide(), ...(s as Partial<BannerSlide>) }))
              : [defaultSlide()]
          );
          // Load autoPlayInterval from settings (stored in ms, display in seconds)
          const settings = w.settings as BannerSliderSettings | null;
          if (settings?.autoPlayInterval) {
            setAutoPlayInterval(Math.round(settings.autoPlayInterval / 1000));
          }
        }
        if (w.type === "collection-grid") {
          const meta = w.metadata as CollectionGridMetadata | null;
          const existing = meta?.items;
          setCollectionItems(
            Array.isArray(existing) && existing.length > 0
              ? existing.map((it) => ({ ...defaultCollectionItem(), ...it }))
              : [defaultCollectionItem()]
          );
          const settings = w.settings as CollectionGridSettings | null;
          if (settings?.cardHeight) {
            setCardHeight(settings.cardHeight);
          }
        }
        if (w.type === "trend-hot") {
          const meta = w.metadata as { items?: CollectionItem[] } | null;
          const existing = meta?.items;
          setTrendHotItems(
            Array.isArray(existing) && existing.length > 0
              ? existing.map((it) => ({ ...defaultTrendHotItem(), ...it }))
              : [defaultTrendHotItem()]
          );
          const settings = w.settings as TrendHotSettings | null;
          if (settings?.cardHeight) setTrendHotCardHeight(settings.cardHeight);
          if (settings?.showBadge !== undefined) setShowTrendHotBadge(settings.showBadge);
        }
        if (w.type === "new-product") {
          const meta = w.metadata as NewProductMetadata | null;
          if (meta?.tag_ids) setNewProductTagIds(meta.tag_ids);
          const settings = w.settings as NewProductSettings | null;
          if (settings?.quantity) setNewProductQuantity(settings.quantity);
          if (settings?.columns) setNewProductColumns(settings.columns);
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

    if (form.type === "collection-grid") {
      const missingIdx = collectionItems.findIndex((it) => !it.image);
      if (missingIdx !== -1) {
        setActiveCollectionItem(missingIdx);
        setError(`Item ${missingIdx + 1} chưa có ảnh`);
        return;
      }
    }

    if (form.type === "trend-hot") {
      const missingIdx = trendHotItems.findIndex((it) => !it.image);
      if (missingIdx !== -1) {
        setActiveTrendHotItem(missingIdx);
        setError(`Item ${missingIdx + 1} chưa có ảnh`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: UpdateWidgetPayload = { name: form.name, name_ja: form.name_ja || undefined, status: form.status };
      if (form.type === "banner-slider") {
        payload.metadata = { slides };
        payload.settings = { autoPlayInterval: autoPlayInterval * 1000 }; // store in ms
      }
      if (form.type === "collection-grid") {
        payload.metadata = { items: collectionItems };
        payload.settings = { cardHeight };
      }
      if (form.type === "trend-hot") {
        payload.metadata = { items: trendHotItems };
        payload.settings = { cardHeight: trendHotCardHeight, showBadge: showTrendHotBadge };
      }
      if (form.type === "new-product") {
        payload.metadata = { tag_ids: newProductTagIds };
        payload.settings = { quantity: newProductQuantity, columns: newProductColumns };
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
        <LanguageTabsForm
          viContent={
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
          }
          jaContent={
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ウィジェット名 (Japanese name)</label>
              <input
                type="text"
                value={form.name_ja}
                onChange={(e) => setForm((p) => ({ ...p, name_ja: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          }
        />

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
          {/* Auto-play settings */}
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Cài Đặt Tự Động</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Thời gian chuyển slide: {autoPlayInterval} giây
              </label>
              <Slider
                value={[autoPlayInterval]}
                onValueChange={(vals) => vals[0] !== undefined && setAutoPlayInterval(vals[0])}
                min={2}
                max={15}
                step={1}
                className="w-full max-w-xs"
              />
              <p className="text-xs text-gray-500 mt-2">
                Thời gian tự động chuyển sang slide tiếp theo (2-15 giây)
              </p>
            </div>
          </div>

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

      {form.type === "collection-grid" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Cài Đặt Hiển Thị</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Chiều cao card: {cardHeight}px
              </label>
              <Slider
                value={[cardHeight]}
                onValueChange={(vals) => vals[0] !== undefined && setCardHeight(vals[0])}
                min={200}
                max={600}
                step={20}
                className="w-full max-w-xs"
              />
              <p className="text-xs text-gray-500 mt-2">
                Chiều cao của mỗi card trên trang chủ (200-600px)
              </p>
            </div>
          </div>

          <CollectionGridPreview
            items={collectionItems}
            activeIndex={activeCollectionItem}
            onActiveChange={setActiveCollectionItem}
            cardHeight={cardHeight}
          />

          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 max-w-2xl">
            <h2 className="text-sm font-semibold text-gray-700">Nội Dung Items</h2>
            <CollectionGridEditor
              items={collectionItems}
              onChange={setCollectionItems}
              activeIndex={activeCollectionItem}
              onActiveChange={setActiveCollectionItem}
            />
          </div>
        </div>
      )}

      {form.type === "trend-hot" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Cài Đặt Hiển Thị</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Chiều cao card: {trendHotCardHeight}px
                </label>
                <Slider
                  value={[trendHotCardHeight]}
                  onValueChange={(vals) => vals[0] !== undefined && setTrendHotCardHeight(vals[0])}
                  min={200}
                  max={600}
                  step={20}
                  className="w-full max-w-xs"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTrendHotBadge}
                  onChange={(e) => setShowTrendHotBadge(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Hiển thị badge &quot;HOT&quot;</span>
              </label>
            </div>
          </div>

          <TrendHotPreview
            items={trendHotItems}
            activeIndex={activeTrendHotItem}
            onActiveChange={setActiveTrendHotItem}
            cardHeight={trendHotCardHeight}
            showBadge={showTrendHotBadge}
            onFullPreview={() => setShowFullPreview(true)}
          />

          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 max-w-2xl">
            <h2 className="text-sm font-semibold text-gray-700">Nội Dung Items</h2>
            <TrendHotEditor
              items={trendHotItems}
              onChange={setTrendHotItems}
              activeIndex={activeTrendHotItem}
              onActiveChange={setActiveTrendHotItem}
            />
          </div>

          <FullPagePreviewModal
            isOpen={showFullPreview}
            onClose={() => setShowFullPreview(false)}
            widgetType="trend-hot"
            data={{ items: trendHotItems, settings: { cardHeight: trendHotCardHeight, showBadge: showTrendHotBadge } }}
          />
        </div>
      )}

      {form.type === "new-product" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Cai Dat Hien Thi</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  So san pham: {newProductQuantity}
                </label>
                <Slider
                  value={[newProductQuantity]}
                  onValueChange={(vals) => vals[0] && setNewProductQuantity(vals[0])}
                  min={5}
                  max={20}
                  step={1}
                  className="w-full max-w-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  So cot: {newProductColumns}
                </label>
                <Slider
                  value={[newProductColumns]}
                  onValueChange={(vals) => vals[0] && setNewProductColumns(vals[0])}
                  min={2}
                  max={5}
                  step={1}
                  className="w-full max-w-xs"
                />
              </div>
            </div>
          </div>

          <NewProductPreview
            tagIds={newProductTagIds}
            quantity={newProductQuantity}
            columns={newProductColumns}
          />

          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 max-w-2xl">
            <h2 className="text-sm font-semibold text-gray-700">Chon Tags</h2>
            <NewProductEditor
              selectedTagIds={newProductTagIds}
              onChange={setNewProductTagIds}
            />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { ImageUploader } from "@/components/admin/image-uploader";
import type { CollectionItem } from "@/types/api";

interface Props {
  items: CollectionItem[];
  onChange: (items: CollectionItem[]) => void;
  activeIndex: number;
  onActiveChange: (index: number) => void;
}

export function defaultCollectionItem(): CollectionItem {
  return {
    id: crypto.randomUUID(),
    title: "",
    image: "",
    link: "",
    cta_text: "Mua Ngay",
  };
}

export function CollectionGridEditor({ items, onChange, activeIndex, onActiveChange }: Props) {
  const item = items[activeIndex];

  const update = (patch: Partial<CollectionItem>) => {
    onChange(items.map((it, i) => (i === activeIndex ? { ...it, ...patch } : it)));
  };

  const addItem = () => {
    const next = [...items, defaultCollectionItem()];
    onChange(next);
    onActiveChange(next.length - 1);
  };

  const removeItem = () => {
    if (items.length <= 1) return;
    const next = items.filter((_, i) => i !== activeIndex);
    onChange(next);
    onActiveChange(Math.min(activeIndex, next.length - 1));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onActiveChange(i)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              i === activeIndex
                ? "bg-blue-600 text-white border-blue-600"
                : "text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            Item {i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="px-3 py-1.5 text-sm rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + Thêm Item
        </button>
      </div>

      {item && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <ImageUploader
            label="Ảnh Collection"
            value={item.image}
            onChange={(url) => update({ image: url })}
            required
            modelType="collection-grid"
          />

          <div className="grid gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tiêu đề</label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="Vd: Thời trang công sở"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Đường dẫn</label>
              <input
                type="text"
                value={item.link}
                onChange={(e) => update({ link: e.target.value })}
                placeholder="Vd: /collections/office"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nút CTA</label>
              <input
                type="text"
                value={item.cta_text}
                onChange={(e) => update({ cta_text: e.target.value })}
                placeholder="Vd: Mua Ngay"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {items.length > 1 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={removeItem}
                className="text-sm text-red-500 hover:text-red-600 transition-colors"
              >
                Xóa item này
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { ImageUploader } from "@/components/admin/image-uploader";
import { Slider } from "@/components/ui/slider";
import type { BannerSlide } from "@/types/api";

interface Props {
  slides: BannerSlide[];
  onChange: (slides: BannerSlide[]) => void;
  activeIndex: number;
  onActiveChange: (index: number) => void;
}

export function defaultSlide(): BannerSlide {
  return {
    id: crypto.randomUUID(),
    image: "",
    label: "",
    title: "",
    description: "",
    cta_text: "",
    cta_link: "",
    text_x: 0,
    text_y: 100,
    font_scale: 1,
  };
}

export function BannerSliderEditor({ slides, onChange, activeIndex, onActiveChange }: Props) {
  const slide = slides[activeIndex];

  const update = (patch: Partial<BannerSlide>) => {
    onChange(slides.map((s, i) => (i === activeIndex ? { ...s, ...patch } : s)));
  };

  const addSlide = () => {
    const next = [...slides, defaultSlide()];
    onChange(next);
    onActiveChange(next.length - 1);
  };

  const removeSlide = () => {
    if (slides.length <= 1) return;
    const next = slides.filter((_, i) => i !== activeIndex);
    onChange(next);
    onActiveChange(Math.min(activeIndex, next.length - 1));
  };

  return (
    <div className="space-y-4">
      {/* Slide tab selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onActiveChange(i)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              i === activeIndex
                ? "bg-blue-600 text-white border-blue-600"
                : "text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            Slide {i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={addSlide}
          className="px-3 py-1.5 text-sm rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + Thêm Slide
        </button>
      </div>

      {/* Active slide editor */}
      {slide && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <ImageUploader
            label="Ảnh Banner"
            value={slide.image}
            onChange={(url) => update({ image: url })}
            required
            modelType="banner-slider"
          />

          <div className="grid gap-3">
            <SlideField
              label="Label nhỏ (màu vàng)"
              value={slide.label}
              onChange={(v) => update({ label: v })}
              placeholder="Vd: Giảm giá lên đến 50%"
            />
            <SlideField
              label="Tiêu đề lớn"
              value={slide.title}
              onChange={(v) => update({ title: v })}
              placeholder="Vd: Bộ Sưu Tập Mùa Hè 2026"
            />
            <SlideField
              label="Mô tả"
              value={slide.description}
              onChange={(v) => update({ description: v })}
              placeholder="Vd: Khám phá những xu hướng thời trang mới nhất"
            />
            <SlideField
              label="Nút CTA – Văn bản"
              value={slide.cta_text}
              onChange={(v) => update({ cta_text: v })}
              placeholder="Vd: Mua Ngay"
            />
            <SlideField
              label="Nút CTA – Đường dẫn"
              value={slide.cta_link}
              onChange={(v) => update({ cta_link: v })}
              placeholder="Vd: /collections/summer"
            />
          </div>

          {/* Position & Size controls */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Vị trí & Kích thước
            </p>
            <div className="grid gap-4">
              <SliderField
                label="Vị trí ngang (X)"
                value={slide.text_x ?? 0}
                onChange={(v) => update({ text_x: v })}
                min={0}
                max={80}
                unit="%"
              />
              <SliderField
                label="Vị trí dọc (Y)"
                value={slide.text_y ?? 100}
                onChange={(v) => update({ text_y: v })}
                min={20}
                max={100}
                unit="%"
              />
              <SliderField
                label="Tỉ lệ chữ"
                value={slide.font_scale ?? 1}
                onChange={(v) => update({ font_scale: v })}
                min={0.5}
                max={2}
                step={0.1}
                unit="x"
              />
            </div>
          </div>

          {slides.length > 1 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={removeSlide}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Xóa slide này
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SlideField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">
        {label}: {value}{unit}
      </label>
      <Slider
        value={[value]}
        onValueChange={(vals) => vals[0] !== undefined && onChange(vals[0])}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
}

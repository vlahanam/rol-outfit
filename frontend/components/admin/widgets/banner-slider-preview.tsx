"use client";

import Image from "next/image";
import type { BannerSlide } from "@/types/api";

interface Props {
  slides: BannerSlide[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
}

export function BannerSliderPreview({ slides, activeIndex, onActiveChange }: Props) {
  const slide = slides[activeIndex];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</p>

      <div
        className="relative w-full overflow-hidden rounded-xl bg-gray-200"
        style={{ aspectRatio: "16 / 6" }}
      >
        {/* Background image */}
        {slide?.image ? (
          <Image
            src={slide.image}
            alt={slide.title || "Banner slide"}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
            <span className="text-sm text-gray-500">Chưa có ảnh</span>
          </div>
        )}

        {/* Left-to-right gradient so text is always readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />

        {/* Overlay text — dynamic position */}
        <div
          className="absolute p-8 space-y-2 max-w-lg transition-all duration-200"
          style={{
            left: `${slide?.text_x ?? 0}%`,
            bottom: `${100 - (slide?.text_y ?? 100)}%`,
            transform: `scale(${slide?.font_scale ?? 1})`,
            transformOrigin: "bottom left",
          }}
        >
          {slide?.label && (
            <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wide">
              {slide.label}
            </p>
          )}
          {slide?.title && (
            <h2 className="text-white text-3xl font-bold leading-tight">
              {slide.title}
            </h2>
          )}
          {slide?.description && (
            <p className="text-gray-200 text-sm">{slide.description}</p>
          )}
          {slide?.cta_text && (
            <div className="pt-2">
              <span className="inline-block px-5 py-2.5 bg-white text-gray-900 text-sm font-medium rounded-lg">
                {slide.cta_text}
              </span>
            </div>
          )}
        </div>

        {/* Dot indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onActiveChange(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === activeIndex ? "bg-white scale-125" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

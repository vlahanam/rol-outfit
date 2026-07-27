"use client";

import { useState } from "react";
import Image from "next/image";
import { Monitor, Smartphone } from "lucide-react";
import type { BannerSlide } from "@/types/api";
import { SlideOverlay } from "@/components/shared/slide-overlay";

type DeviceMode = "desktop" | "mobile";

interface Props {
  slides: BannerSlide[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
}

export function BannerSliderPreview({ slides, activeIndex, onActiveChange }: Props) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const slide = slides[activeIndex];
  const isMobile = deviceMode === "mobile";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</p>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setDeviceMode("desktop")}
            className={`p-1.5 rounded transition-colors ${
              !isMobile ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
            title="Desktop preview"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode("mobile")}
            className={`p-1.5 rounded transition-colors ${
              isMobile ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
            title="Mobile preview"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-xl bg-gray-200 mx-auto transition-all duration-300 ${
          isMobile ? "max-w-[320px]" : "w-full"
        }`}
        style={{ aspectRatio: isMobile ? "9 / 16" : "16 / 6" }}
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

        {/* Text overlay */}
        {slide && (
          <SlideOverlay
            slide={slide}
            isActive={true}
            linkEnabled={false}
            isMobilePreview={isMobile}
          />
        )}

        {/* Dot indicators */}
        {slides.length > 1 && (
          <div className={`absolute left-1/2 -translate-x-1/2 flex ${
            isMobile ? "bottom-3 gap-1.5" : "bottom-4 gap-2"
          }`}>
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onActiveChange(i)}
                className={`rounded-full transition-all ${
                  isMobile ? "w-1.5 h-1.5" : "w-2 h-2"
                } ${i === activeIndex ? "bg-white scale-125" : "bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

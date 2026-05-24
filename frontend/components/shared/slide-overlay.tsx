"use client";

import Link from "next/link";
import type { BannerSlide } from "@/types/api";

interface SlideOverlayProps {
  slide: BannerSlide;
  isActive?: boolean;
  linkEnabled?: boolean;
  className?: string;
  /** Force mobile styling in admin preview */
  isMobilePreview?: boolean;
}

export function SlideOverlay({
  slide,
  isActive = true,
  linkEnabled = false,
  className = "",
  isMobilePreview = false,
}: SlideOverlayProps) {
  const baseScale = slide.font_scale ?? 1;
  // Mobile uses smaller scale for better fit
  const mobileScale = Math.min(baseScale * 0.6, 0.8);
  const scale = isMobilePreview ? mobileScale : baseScale;

  // Adjust position for mobile (center horizontally, lower vertically)
  const textX = isMobilePreview ? 50 : (slide.text_x ?? 5);
  const textY = isMobilePreview ? 20 : (slide.text_y ?? 80);

  const positionStyle = {
    left: isMobilePreview ? "50%" : `${textX}%`,
    bottom: `${100 - textY}%`,
    transform: isMobilePreview
      ? `translateX(-50%) scale(${scale})`
      : `scale(${scale})`,
    transformOrigin: isMobilePreview ? "bottom center" : "bottom left",
  };

  const textAlign = isMobilePreview ? "text-center" : "text-left";

  return (
    <div
      className={`absolute p-4 sm:p-6 md:p-8 space-y-1.5 sm:space-y-2 max-w-[90%] sm:max-w-md md:max-w-lg transition-opacity duration-300 ${
        isActive ? "opacity-100" : "opacity-0 pointer-events-none"
      } ${textAlign} ${className}`}
      style={positionStyle}
    >
      {slide.label && (
        <p className="text-yellow-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wide">
          {slide.label}
        </p>
      )}
      {slide.title && (
        <h2 className="text-white text-lg sm:text-2xl md:text-4xl font-bold leading-tight">
          {slide.title}
        </h2>
      )}
      {slide.description && (
        <p className="text-gray-200 text-xs sm:text-sm md:text-base line-clamp-2 sm:line-clamp-none">
          {slide.description}
        </p>
      )}
      {slide.cta_text && (
        <div className="pt-1.5 sm:pt-2">
          {linkEnabled && slide.cta_link ? (
            <Link
              href={slide.cta_link}
              className="inline-block px-3 py-1.5 sm:px-5 sm:py-2.5 bg-white text-gray-900 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              {slide.cta_text}
            </Link>
          ) : (
            <span className="inline-block px-3 py-1.5 sm:px-5 sm:py-2.5 bg-white text-gray-900 text-xs sm:text-sm font-medium rounded-lg">
              {slide.cta_text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BannerSlide } from "@/types/api";

interface BannerSliderProps {
  slides: BannerSlide[];
  autoPlayInterval?: number;
}

export function BannerSlider({
  slides,
  autoPlayInterval = 5000,
}: BannerSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const showControls = slides.length > 1;

  const goToSlide = useCallback(
    (index: number) => {
      setActiveIndex((index + slides.length) % slides.length);
    },
    [slides.length]
  );

  const goNext = useCallback(
    () => goToSlide(activeIndex + 1),
    [activeIndex, goToSlide]
  );
  const goPrev = useCallback(
    () => goToSlide(activeIndex - 1),
    [activeIndex, goToSlide]
  );

  useEffect(() => {
    if (!showControls || isPaused) return;
    const timer = setInterval(goNext, autoPlayInterval);
    return () => clearInterval(timer);
  }, [showControls, isPaused, goNext, autoPlayInterval]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  if (!slides.length) return null;

  const slide = slides[activeIndex];

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{ aspectRatio: "16 / 6" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slide.image ? (
        <img
          src={slide.image}
          alt={slide.title || "Banner"}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-500" />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />

      <div
        className="absolute p-6 md:p-8 space-y-2 max-w-lg transition-all duration-300"
        style={{
          left: `${slide.text_x ?? 5}%`,
          bottom: `${100 - (slide.text_y ?? 80)}%`,
          transform: `scale(${slide.font_scale ?? 1})`,
          transformOrigin: "bottom left",
        }}
      >
        {slide.label && (
          <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wide">
            {slide.label}
          </p>
        )}
        {slide.title && (
          <h2 className="text-white text-2xl md:text-4xl font-bold leading-tight">
            {slide.title}
          </h2>
        )}
        {slide.description && (
          <p className="text-gray-200 text-sm md:text-base">
            {slide.description}
          </p>
        )}
        {slide.cta_text && slide.cta_link && (
          <div className="pt-2">
            <Link
              href={slide.cta_link}
              className="inline-block px-5 py-2.5 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              {slide.cta_text}
            </Link>
          </div>
        )}
      </div>

      {showControls && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-sm transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-sm transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {showControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === activeIndex
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

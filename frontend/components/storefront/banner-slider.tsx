"use client";

import { useState, useEffect, useRef, useCallback } from "react";
/* eslint-disable @next/next/no-img-element */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SlideOverlay } from "@/components/shared/slide-overlay";
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
      className="relative w-full overflow-hidden rounded-xl aspect-[4/5] sm:aspect-[16/9] md:aspect-[16/6]"
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

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />

      {/* All slide overlays - only active one visible */}
      {slides.map((s, i) => (
        <SlideOverlay
          key={s.id ?? i}
          slide={s}
          isActive={i === activeIndex}
          linkEnabled={true}
        />
      ))}

      {showControls && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-sm transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-sm transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </>
      )}

      {showControls && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all ${
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

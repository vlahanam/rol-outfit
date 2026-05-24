"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CollectionCard } from "@/components/CollectionCard";
import type { CollectionItem } from "@/types/api";

interface CollectionSliderProps {
  items: CollectionItem[];
  title: string;
  cardHeight?: number;
}

export function CollectionSlider({ items, title, cardHeight = 400 }: CollectionSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    checkScrollability();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScrollability);
      window.addEventListener("resize", checkScrollability);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScrollability);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("div")?.offsetWidth ?? 200;
    const scrollAmount = cardWidth + 16;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="mb-8 sm:mb-12">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
        <div className="flex gap-1.5 sm:gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="p-1.5 sm:p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="p-1.5 sm:p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        style={
          {
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "--card-height": `${cardHeight}px`,
          } as React.CSSProperties
        }
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-[calc(50vw-24px)] sm:w-[220px] md:w-[280px] h-[280px] sm:h-[var(--card-height)]"
          >
            <CollectionCard
              title={item.title}
              image={item.image}
              link={item.link}
              ctaText={item.cta_text}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

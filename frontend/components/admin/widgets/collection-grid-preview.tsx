"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Monitor, Smartphone, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { CollectionItem } from "@/types/api";

type DeviceMode = "desktop" | "mobile";

interface Props {
  items: CollectionItem[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
  cardHeight?: number;
}

export function CollectionGridPreview({ items, activeIndex, onActiveChange, cardHeight = 400 }: Props) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isMobile = deviceMode === "mobile";
  const previewHeight = Math.round(cardHeight * 0.55);
  const cardWidth = isMobile ? 140 : 180;

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
    const scrollAmount = cardWidth + 12;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 text-sm">
        Chưa có item nào
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</p>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="p-1.5 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="p-1.5 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            onClick={() => onActiveChange(i)}
            style={{ height: previewHeight, width: cardWidth, flexShrink: 0 }}
            className={`relative rounded-lg overflow-hidden cursor-pointer group transition-all ${
              i === activeIndex ? "ring-2 ring-blue-500 ring-offset-2" : "hover:ring-2 hover:ring-gray-300"
            }`}
          >
            {item.image ? (
              <Image
                src={item.image}
                alt={item.title || "Collection item"}
                fill
                unoptimized
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <span className="text-xs text-gray-500">Chưa có ảnh</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
              <h3 className={`font-semibold mb-1 ${isMobile ? "text-xs" : "text-sm"}`}>
                {item.title || "Chưa có tiêu đề"}
              </h3>
              <div className="flex items-center gap-1 text-xs opacity-90">
                {item.cta_text || "Mua Ngay"} <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {i === activeIndex && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                Đang sửa
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

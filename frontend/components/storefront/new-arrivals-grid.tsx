"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ProductItem } from "@/components/ProductItem";
import type { Product } from "@/types/api";
import { formatPrice, getFirstImageUrl } from "@/lib/format";

interface NewArrivalsGridProps {
  title: string;
  products: Product[];
  autoScrollInterval?: number;
}

const VISIBLE_ROWS = 2;
const SCROLL_COLUMNS = 2;
const GAP_PX = 24;

export function NewArrivalsGrid({ title, products, autoScrollInterval = 5000 }: NewArrivalsGridProps) {
  const [scrollIndex, setScrollIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleCols, setVisibleCols] = useState(4);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalColumns = Math.ceil(products.length / VISIBLE_ROWS);
  const itemWidth = containerWidth > 0 ? (containerWidth - GAP_PX * (visibleCols - 1)) / visibleCols : 0;

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const cols = width >= 768 ? 4 : width >= 640 ? 3 : 2;
      setVisibleCols(cols);

      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (scrollIndex >= totalColumns) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setScrollIndex(0);
      }, 500);
      return () => clearTimeout(timeout);
    }
    if (!isTransitioning) {
      const timeout = setTimeout(() => setIsTransitioning(true), 50);
      return () => clearTimeout(timeout);
    }
  }, [scrollIndex, totalColumns, isTransitioning]);

  const scroll = useCallback((direction: "left" | "right") => {
    if (direction === "left") {
      setScrollIndex((prev) => (prev <= 0 ? totalColumns - SCROLL_COLUMNS : prev - SCROLL_COLUMNS));
    } else {
      setScrollIndex((prev) => prev + SCROLL_COLUMNS);
    }
  }, [totalColumns]);

  useEffect(() => {
    if (isPaused || totalColumns <= visibleCols) return;
    const timer = setInterval(() => scroll("right"), autoScrollInterval);
    return () => clearInterval(timer);
  }, [isPaused, autoScrollInterval, scroll, totalColumns, visibleCols]);

  const row1 = products.filter((_, i) => i % VISIBLE_ROWS === 0);
  const row2 = products.filter((_, i) => i % VISIBLE_ROWS === 1);

  const extendedRow1 = [...row1, ...row1.slice(0, visibleCols)];
  const extendedRow2 = [...row2, ...row2.slice(0, visibleCols)];

  const translateX = scrollIndex * (itemWidth + GAP_PX);
  const gapAdjust = (GAP_PX * (visibleCols - 1)) / visibleCols;
  const itemWidthPercent = 100 / visibleCols;

  return (
    <section
      className="mb-12"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-2 border border-gray-300 rounded-full transition-colors hover:bg-gray-50"
            aria-label="Previous products"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 border border-gray-300 rounded-full transition-colors hover:bg-gray-50"
            aria-label="Next products"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="overflow-hidden">
        <div className="flex flex-col gap-6">
          {[extendedRow1, extendedRow2].map((row, rowIndex) => (
            <div key={rowIndex} className="overflow-hidden">
              <div
                className={`flex ${isTransitioning ? "transition-transform duration-500 ease-in-out" : ""}`}
                style={{
                  gap: `${GAP_PX}px`,
                  transform: `translateX(-${translateX}px)`,
                }}
              >
                {row.map((p, idx) => (
                  <Link
                    key={`${p.id}-${idx}`}
                    href={`/product/${p.slug}`}
                    className="flex-shrink-0"
                    style={{ width: itemWidth > 0 ? `${itemWidth}px` : `calc(${itemWidthPercent}% - ${gapAdjust}px)` }}
                  >
                    <ProductItem
                      name={p.name}
                      price={formatPrice(p.sale_price, p.product_type)}
                      originalPrice={p.discount_percent > 0 ? formatPrice(p.default_price, p.product_type) : undefined}
                      discountPercent={p.discount_percent > 0 ? p.discount_percent : undefined}
                      image={getFirstImageUrl(p.images) ?? (p.avatar || "/placeholder-product.svg")}
                      tags={p.tags}
                      maxTags={2}
                    />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

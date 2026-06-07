"use client";

import { useState } from "react";
import type { Tag } from "@/types/api";

const TAG_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-rose-100 text-rose-700",
];

function ImagePlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400" aria-hidden="true">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
        <circle cx="9" cy="9" r="2"></circle>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
      </svg>
    </div>
  );
}

interface ProductItemProps {
  name: string;
  price: string;
  originalPrice?: string;
  discountPercent?: number;
  image?: string;
  rating?: number;
  tags?: Tag[];
  maxTags?: number;
}

export function ProductItem({ name, price, originalPrice, discountPercent, image, tags, maxTags = 2 }: ProductItemProps) {
  const displayTags = tags?.slice(0, maxTags) ?? [];
  const [imgError, setImgError] = useState(false);
  const hasValidImage = image && !imgError;

  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
        {hasValidImage ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <ImagePlaceholder />
        )}
        {displayTags.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {displayTags.map((tag, i) => (
              <span
                key={tag.id}
                className={`text-xs px-2.5 py-1 rounded font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        {discountPercent && discountPercent > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
            -{discountPercent}%
          </span>
        )}
      </div>
      <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{name}</h4>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-gray-900 font-semibold">{price}</p>
        {originalPrice && (
          <p className="text-sm text-gray-400 line-through">{originalPrice}</p>
        )}
      </div>
    </div>
  );
}

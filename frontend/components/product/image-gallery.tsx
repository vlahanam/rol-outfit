import { ImageIcon } from "lucide-react";

interface Props {
  images: string[];
  activeIndex: number;
  onSelect: (i: number) => void;
  alt?: string;
}

export function ImageGallery({ images, activeIndex, onSelect, alt = "Product" }: Props) {
  const src = images.length > 0 ? images[activeIndex] ?? images[0] : null;

  return (
    <div>
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
        {src ? (
          <img id="product-main-img" src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-16 h-16 text-gray-400" />
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                activeIndex === idx ? "border-blue-600" : "border-transparent hover:border-gray-300"
              }`}
            >
              <img src={img} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

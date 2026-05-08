const FALLBACK = "https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

interface Props {
  images: string[];
  activeIndex: number;
  onSelect: (i: number) => void;
  alt?: string;
}

export function ImageGallery({ images, activeIndex, onSelect, alt = "Product" }: Props) {
  const src = images.length > 0 ? images[activeIndex] ?? images[0] : FALLBACK;

  return (
    <div>
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
        <img src={src} alt={alt} className="w-full h-full object-cover" />
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

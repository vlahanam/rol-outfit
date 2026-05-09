interface ProductItemProps {
  name: string;
  price: string;
  originalPrice?: string;
  discountPercent?: number;
  image: string;
  rating?: number;
  isNew?: boolean;
}

export function ProductItem({ name, price, originalPrice, discountPercent, image, isNew }: ProductItemProps) {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isNew && (
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            NEW
          </span>
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

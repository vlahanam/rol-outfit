interface ProductItemProps {
  name: string;
  price: string;
  image: string;
  rating?: number;
  isNew?: boolean;
}

export function ProductItem({ name, price, image, isNew }: ProductItemProps) {
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
      </div>
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{name}</h4>
      <p className="text-gray-900 font-semibold">{price}</p>
    </div>
  );
}

import { ArrowRight } from 'lucide-react';

interface TrendingCardProps {
  title: string;
  image: string;
  span?: string;
}

export function TrendingCard({ title, image, span }: TrendingCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-lg group cursor-pointer ${span || ''}`}>
      <div className="aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-6">
        <div className="text-white w-full">
          <h3 className="text-2xl font-bold mb-3">{title}</h3>
          <button className="flex items-center gap-2 text-sm bg-white text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors">
            Khám Phá <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

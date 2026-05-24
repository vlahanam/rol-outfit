import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface CollectionCardProps {
  title: string;
  image: string;
  link?: string;
  ctaText?: string;
  span?: string;
}

export function CollectionCard({ title, image, link, ctaText = "Mua Ngay", span }: CollectionCardProps) {
  const content = (
    <div className={`relative overflow-hidden rounded-lg group cursor-pointer h-full ${span || ''}`}>
      <div className="h-full overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-6">
        <div className="text-white">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <span className="flex items-center gap-1 text-sm hover:gap-2 transition-all">
            {ctaText} <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );

  return link ? <Link href={link}>{content}</Link> : content;
}

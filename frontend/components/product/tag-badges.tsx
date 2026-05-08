import type { Tag } from "@/types/api";

const BADGE_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-rose-100 text-rose-700",
];

interface Props {
  tags: Tag[];
}

export function TagBadges({ tags }: Props) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {tags.map((tag, i) => (
        <span
          key={tag.id}
          className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${BADGE_COLORS[i % BADGE_COLORS.length]}`}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Tag } from "@/types/api";

interface Props {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function NewProductEditor({ selectedTagIds, onChange }: Props) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminTags
      .listAll()
      .then((res) => setTags(res.data))
      .finally(() => setLoading(false));
  }, []);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Dang tai tags...</div>;

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-600">
        Chon Tags (san pham co bat ky tag nao se xuat hien)
      </label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              selectedTagIds.includes(tag.id)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>
      {tags.length === 0 && (
        <p className="text-sm text-gray-500">Chua co tag nao. Tao tag trong muc Quan ly Tags.</p>
      )}
    </div>
  );
}

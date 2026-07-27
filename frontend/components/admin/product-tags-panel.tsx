'use client';

import { useEffect, useRef, useState } from "react";
import { X, Plus, ChevronDown } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Tag } from "@/types/api";

interface Props {
  productId: string;
  currentTags: Tag[];
  onSaved: (tags: Tag[]) => void;
}

export function ProductTagsPanel({ productId, currentTags, onSaved }: Props) {
  const [assigned, setAssigned] = useState<Tag[]>(currentTags);
  const [available, setAvailable] = useState<Tag[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.adminTags.listAll().then((res) => setAvailable(res.data ?? []));
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const persist = async (next: Tag[], prev: Tag[]) => {
    setSaving(true);
    setError(null);
    try {
      await api.adminProducts.assignTags(productId, next.map((t) => t.id));
      onSaved(next);
    } catch (e) {
      setAssigned(prev);
      setError(e instanceof ApiError ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const addTag = (tag: Tag) => {
    if (assigned.length >= 3 || saving) return;
    const prev = assigned;
    const next = [...assigned, tag];
    setAssigned(next);
    setPickerOpen(false);
    persist(next, prev);
  };

  const removeTag = (id: string) => {
    if (saving) return;
    const prev = assigned;
    const next = assigned.filter((t) => t.id !== id);
    setAssigned(next);
    persist(next, prev);
  };

  const unassigned = available.filter((t) => !assigned.find((a) => a.id === t.id));
  const atMax = assigned.length >= 3;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Thẻ Tag</h2>
        <span className="text-sm text-gray-500">{assigned.length} / 3 thẻ tag</span>
      </div>

      {error && (
        <div className="mb-3 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex flex-wrap gap-2 mb-4 min-h-[2rem]">
        {assigned.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
          >
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              disabled={saving}
              className="ml-1 hover:text-blue-900 disabled:opacity-50"
              aria-label={`Xóa tag ${tag.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {assigned.length === 0 && (
          <span className="text-sm text-gray-400">Chưa có thẻ tag nào</span>
        )}
      </div>

      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => !atMax && !saving && setPickerOpen((v) => !v)}
          disabled={atMax || saving}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 text-gray-600 text-sm rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          {atMax ? "Đã đạt tối đa 3 thẻ tag" : "Thêm thẻ tag"}
          {!atMax && <ChevronDown className="w-3 h-3" />}
        </button>

        {pickerOpen && unassigned.length > 0 && (
          <div className="absolute z-10 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
            {unassigned.map((tag) => (
              <button
                key={tag.id}
                onClick={() => addTag(tag)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {pickerOpen && unassigned.length === 0 && (
          <div className="absolute z-10 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-3 px-4 text-sm text-gray-500">
            Không còn thẻ tag nào để thêm
          </div>
        )}
      </div>

      {saving && <p className="mt-2 text-xs text-gray-400">Đang lưu...</p>}
    </div>
  );
}

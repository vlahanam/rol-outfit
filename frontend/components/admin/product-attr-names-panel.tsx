"use client";

import { useState } from "react";
import { Pencil, Plus, Save, X } from "lucide-react";
import { api } from "@/lib/api";

type Props = {
  productId: string;
  attrNames: string[];
  onSaved: (names: string[]) => void;
};

export function ProductAttrNamesPanel({
  productId,
  attrNames,
  onSaved,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<string[]>(attrNames);
  const [newInput, setNewInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    setDraft([...attrNames]);
    setNewInput("");
    setError(null);
    setEditMode(true);
  };

  const addName = () => {
    const t = newInput.trim();
    if (!t || draft.includes(t)) return;
    setDraft((p) => [...p, t]);
    setNewInput("");
  };

  const removeName = (name: string) =>
    setDraft((p) => p.filter((a) => a !== name));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.adminProducts.update(productId, { attribute_names: draft });
      onSaved(draft);
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi lưu");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Tên Thuộc Tính Biến Thể
        </h2>
        {editMode ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
            >
              <X className="w-4 h-4" /> Hủy
            </button>
          </div>
        ) : (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
          >
            <Pencil className="w-4 h-4" /> Chỉnh sửa
          </button>
        )}
      </div>

      {editMode && (
        <p className="mb-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Lưu ý: thay đổi tên thuộc tính không tự động cập nhật các biến thể
          hiện có.
        </p>
      )}

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 flex-wrap mb-3">
        {(editMode ? draft : attrNames).map((name) => (
          <span
            key={name}
            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
          >
            {name}
            {editMode && (
              <button
                type="button"
                onClick={() => removeName(name)}
                className="hover:text-blue-600 ml-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </span>
        ))}
        {!editMode && attrNames.length === 0 && (
          <span className="text-sm text-gray-400 italic">
            Chưa có thuộc tính nào.
          </span>
        )}
      </div>

      {editMode && (
        <div className="flex gap-2">
          <input
            value={newInput}
            onChange={(e) => setNewInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addName();
              }
            }}
            placeholder="Nhập tên thuộc tính (vd: Size, Màu sắc)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addName}
            className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </div>
      )}
    </div>
  );
}

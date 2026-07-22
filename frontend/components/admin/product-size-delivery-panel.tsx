"use client";

import { useState } from "react";
import { Pencil, Save, X, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { LanguageTabsForm } from "@/components/admin/language-tabs-form";
import type { AdminProduct, SizeGuideEntry, DeliveryInfoEntry } from "@/types/api";

type Props = {
  product: AdminProduct;
  onSaved: (updates: Partial<AdminProduct>) => void;
};

export function ProductSizeDeliveryPanel({ product, onSaved }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [sizeGuide, setSizeGuide] = useState<SizeGuideEntry[]>(
    product.size_guide ?? []
  );
  const [sizeGuideJa, setSizeGuideJa] = useState<SizeGuideEntry[]>(
    product.size_guide_ja ?? []
  );
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfoEntry[]>(
    product.delivery_info ?? []
  );
  const [deliveryInfoJa, setDeliveryInfoJa] = useState<DeliveryInfoEntry[]>(
    product.delivery_info_ja ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.adminProducts.update(product.id, {
        size_guide: sizeGuide.length > 0 ? sizeGuide : undefined,
        size_guide_ja: sizeGuideJa.length > 0 ? sizeGuideJa : undefined,
        delivery_info: deliveryInfo.length > 0 ? deliveryInfo : undefined,
        delivery_info_ja: deliveryInfoJa.length > 0 ? deliveryInfoJa : undefined,
      });
      onSaved({
        size_guide: sizeGuide.length > 0 ? sizeGuide : null,
        size_guide_ja: sizeGuideJa.length > 0 ? sizeGuideJa : null,
        delivery_info: deliveryInfo.length > 0 ? deliveryInfo : null,
        delivery_info_ja: deliveryInfoJa.length > 0 ? deliveryInfoJa : null,
      });
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi lưu");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSizeGuide(product.size_guide ?? []);
    setSizeGuideJa(product.size_guide_ja ?? []);
    setDeliveryInfo(product.delivery_info ?? []);
    setDeliveryInfoJa(product.delivery_info_ja ?? []);
    setEditMode(false);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Hướng dẫn chọn size & Thời gian giao hàng
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
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
          >
            <Pencil className="w-4 h-4" /> Chỉnh sửa
          </button>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {editMode ? (
        <div className="space-y-6">
          <LanguageTabsForm
            viContent={
              <div className="space-y-4">
                <SizeGuideEditor entries={sizeGuide} onChange={setSizeGuide} />
                <DeliveryInfoEditor entries={deliveryInfo} onChange={setDeliveryInfo} />
              </div>
            }
            jaContent={
              <div className="space-y-4">
                <SizeGuideEditor entries={sizeGuideJa} onChange={setSizeGuideJa} />
                <DeliveryInfoEditor entries={deliveryInfoJa} onChange={setDeliveryInfoJa} />
              </div>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Hướng dẫn chọn size</h3>
            {sizeGuide.length > 0 ? (
              <SizeGuideTable entries={sizeGuide} />
            ) : (
              <p className="text-sm text-gray-500 italic">Sử dụng mặc định</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Thời gian giao hàng</h3>
            {deliveryInfo.length > 0 ? (
              <DeliveryInfoList entries={deliveryInfo} />
            ) : (
              <p className="text-sm text-gray-500 italic">Sử dụng mặc định</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SizeGuideTable({ entries }: { entries: SizeGuideEntry[] }) {
  return (
    <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-3 py-2 text-left font-medium text-gray-700">Size</th>
          <th className="px-3 py-2 text-left font-medium text-gray-700">Chiều cao</th>
          <th className="px-3 py-2 text-left font-medium text-gray-700">Cân nặng</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr key={i} className="border-t border-gray-100">
            <td className="px-3 py-2">{e.size}</td>
            <td className="px-3 py-2">{e.height}</td>
            <td className="px-3 py-2">{e.weight}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DeliveryInfoList({ entries }: { entries: DeliveryInfoEntry[] }) {
  return (
    <ul className="space-y-1 text-sm">
      {entries.map((e, i) => (
        <li key={i} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
          {e.region}: {e.time}
        </li>
      ))}
    </ul>
  );
}

function SizeGuideEditor({
  entries,
  onChange,
}: {
  entries: SizeGuideEntry[];
  onChange: (e: SizeGuideEntry[]) => void;
}) {
  const addEntry = () => {
    onChange([...entries, { size: "", height: "", weight: "" }]);
  };

  const updateEntry = (idx: number, field: keyof SizeGuideEntry, value: string) => {
    const updated = [...entries];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const removeEntry = (idx: number) => {
    onChange(entries.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">Hướng dẫn chọn size</label>
        <button
          type="button"
          onClick={addEntry}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" /> Thêm
        </button>
      </div>
      {entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map((entry, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                value={entry.size}
                onChange={(e) => updateEntry(idx, "size", e.target.value)}
                placeholder="Size"
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                value={entry.height}
                onChange={(e) => updateEntry(idx, "height", e.target.value)}
                placeholder="Chiều cao"
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                value={entry.weight}
                onChange={(e) => updateEntry(idx, "weight", e.target.value)}
                placeholder="Cân nặng"
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
              <button
                type="button"
                onClick={() => removeEntry(idx)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">Để trống sẽ sử dụng mặc định</p>
      )}
    </div>
  );
}

function DeliveryInfoEditor({
  entries,
  onChange,
}: {
  entries: DeliveryInfoEntry[];
  onChange: (e: DeliveryInfoEntry[]) => void;
}) {
  const addEntry = () => {
    onChange([...entries, { region: "", time: "" }]);
  };

  const updateEntry = (idx: number, field: keyof DeliveryInfoEntry, value: string) => {
    const updated = [...entries];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const removeEntry = (idx: number) => {
    onChange(entries.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">Thời gian giao hàng</label>
        <button
          type="button"
          onClick={addEntry}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" /> Thêm
        </button>
      </div>
      {entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map((entry, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                value={entry.region}
                onChange={(e) => updateEntry(idx, "region", e.target.value)}
                placeholder="Khu vực"
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                value={entry.time}
                onChange={(e) => updateEntry(idx, "time", e.target.value)}
                placeholder="Thời gian"
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
              <button
                type="button"
                onClick={() => removeEntry(idx)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">Để trống sẽ sử dụng mặc định</p>
      )}
    </div>
  );
}

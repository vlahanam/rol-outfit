"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { api, ApiError } from "@/lib/api";
import type { Widget } from "@/types/api";
import { WidgetRow } from "@/components/admin/widgets/widget-row";

export default function ListWidgetPage() {
  const router = useRouter();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSaving = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    api.adminWidgets
      .list({ limit: 10 })
      .then((res) => setWidgets(res.data ?? []))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra"))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggleStatus(widget: Widget) {
    const newStatus = widget.status === 2 ? 1 : 2;
    setWidgets((prev) =>
      prev.map((w) => (w.id === widget.id ? { ...w, status: newStatus } : w)),
    );
    try {
      await api.adminWidgets.update(widget.id, { status: newStatus });
    } catch {
      setWidgets((prev) =>
        prev.map((w) => (w.id === widget.id ? { ...w, status: widget.status } : w)),
      );
      setError("Không thể cập nhật trạng thái. Vui lòng thử lại.");
    }
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id || isSaving.current) return;

    const oldIdx = widgets.findIndex((w) => w.id === active.id);
    const newIdx = widgets.findIndex((w) => w.id === over.id);
    const reordered = arrayMove(widgets, oldIdx, newIdx);
    setWidgets(reordered);

    isSaving.current = true;
    const updates = reordered
      .map((w, i) => ({ w, order: i + 1 }))
      .filter(({ w, order }) => w.display_order !== order);

    try {
      await Promise.all(
        updates.map(({ w, order }) => api.adminWidgets.update(w.id, { display_order: order })),
      );
      setWidgets((prev) =>
        prev.map((w, i) => ({ ...w, display_order: i + 1 })),
      );
    } catch {
      setError("Không thể cập nhật thứ tự. Vui lòng thử lại.");
    } finally {
      isSaving.current = false;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Widget</h1>
        <p className="text-gray-600 text-sm">Widget hiển thị trên trang chủ</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-500 text-sm">Đang tải...</div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full min-w-max">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Thứ Tự
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Trạng Thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Ngày Tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Hành Động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <SortableContext
                    items={widgets.map((w) => w.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {widgets.map((w) => (
                      <WidgetRow
                        key={w.id}
                        widget={w}
                        onEdit={(id) => router.push(`/admin/widgets/${id}/edit`)}
                        onToggleStatus={handleToggleStatus}
                      />
                    ))}
                  </SortableContext>
                  {widgets.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500 text-sm">
                        Không có widget nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}

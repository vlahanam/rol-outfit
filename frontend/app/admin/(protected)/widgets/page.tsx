"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
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
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { api, ApiError } from "@/lib/api";
import type { Widget } from "@/types/api";
import { WidgetSortableRow } from "@/components/admin/widgets/widget-sortable-row";

export default function ListWidgetPage() {
  const router = useRouter();
  const [roots, setRoots] = useState<Widget[]>([]);
  const [children, setChildren] = useState<Record<string, Widget[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Widget | null>(null);
  const isSaving = useRef(false);
  const loadedParents = useRef(new Set<string>());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function fetchRoots() {
    api.adminWidgets
      .list({ limit: 100 })
      .then((res) => setRoots(res.data ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    api.adminWidgets
      .list({ limit: 100 })
      .then((res) => setRoots(res.data ?? []))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra"))
      .finally(() => setLoading(false));
  }, []);

  const loadChildren = useCallback(async (parentId: string) => {
    if (loadedParents.current.has(parentId)) {
      setExpanded((prev) => ({ ...prev, [parentId]: !prev[parentId] }));
      return;
    }
    try {
      const res = await api.adminWidgets.list({ parent_id: parentId, limit: 100 });
      loadedParents.current.add(parentId);
      setChildren((prev) => ({ ...prev, [parentId]: res.data ?? [] }));
      setExpanded((prev) => ({ ...prev, [parentId]: true }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra");
    }
  }, []);

  function findInAll(id: string): Widget | undefined {
    return (
      roots.find((w) => w.id === id) ??
      Object.values(children)
        .flat()
        .find((w) => w.id === id)
    );
  }

  async function updateDisplayOrders(list: Widget[]) {
    isSaving.current = true;
    const updates = list
      .map((w, i) => ({ w, order: i + 1 }))
      .filter(({ w, order }) => w.display_order !== order);
    try {
      await Promise.all(
        updates.map(({ w, order }) => api.adminWidgets.update(w.id, { display_order: order })),
      );
    } catch {
      setError("Không thể cập nhật thứ tự. Vui lòng thử lại.");
      fetchRoots();
      setChildren({});
      loadedParents.current.clear();
    } finally {
      isSaving.current = false;
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id || search || isSaving.current) return;
    const activeW = findInAll(String(active.id));
    const overW = findInAll(String(over.id));
    if (!activeW || !overW || activeW.parent_id !== overW.parent_id) return;

    if (activeW.parent_id === null) {
      const oldIdx = roots.findIndex((w) => w.id === active.id);
      const newIdx = roots.findIndex((w) => w.id === over.id);
      const newRoots = arrayMove(roots, oldIdx, newIdx);
      setRoots(newRoots);
      updateDisplayOrders(newRoots);
    } else {
      const parentId = activeW.parent_id;
      const kids = children[parentId] ?? [];
      const oldIdx = kids.findIndex((w) => w.id === active.id);
      const newIdx = kids.findIndex((w) => w.id === over.id);
      const newKids = arrayMove(kids, oldIdx, newIdx);
      setChildren((prev) => ({ ...prev, [parentId]: newKids }));
      updateDisplayOrders(newKids);
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.adminWidgets.remove(deleteTarget.id);
      const targetId = deleteTarget.id;
      const parentId = deleteTarget.parent_id;
      setRoots((prev) => prev.filter((w) => w.id !== targetId));
      setChildren((prev) => {
        const next = { ...prev };
        if (parentId && next[parentId]) {
          next[parentId] = next[parentId].filter((w) => w.id !== targetId);
        }
        delete next[targetId];
        return next;
      });
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
      loadedParents.current.delete(targetId);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xóa thất bại");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredRoots = roots.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Widget</h1>
          <p className="text-gray-600 text-sm">Widget hiển thị trên trang chủ</p>
        </div>
        <Link
          href="/admin/widgets/add"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Thêm Widget
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên widget..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

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
                    items={filteredRoots.map((w) => w.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredRoots.map((w) => (
                      <React.Fragment key={w.id}>
                        <WidgetSortableRow
                          widget={w}
                          isChild={false}
                          expanded={!!expanded[w.id]}
                          onToggleExpand={loadChildren}
                          onEdit={(id) => router.push(`/admin/widgets/${id}/edit`)}
                          onDelete={setDeleteTarget}
                        />
                        {expanded[w.id] && (
                          <SortableContext
                            items={(children[w.id] ?? []).map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {(children[w.id] ?? []).map((child) => (
                              <WidgetSortableRow
                                key={child.id}
                                widget={child}
                                isChild={true}
                                expanded={false}
                                onToggleExpand={() => {}}
                                onEdit={(id) => router.push(`/admin/widgets/${id}/edit`)}
                                onDelete={setDeleteTarget}
                              />
                            ))}
                          </SortableContext>
                        )}
                      </React.Fragment>
                    ))}
                  </SortableContext>
                  {filteredRoots.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500 text-sm">
                        Không tìm thấy widget nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </DndContext>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        title="Xóa Widget"
        message={`Bạn có chắc chắn muốn xóa widget "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

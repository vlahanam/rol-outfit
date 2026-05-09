"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { api, WIDGET_STATUS_LABEL, WIDGET_TYPE_LABEL, ApiError } from "@/lib/api";
import type { Widget } from "@/types/api";

export default function ListWidgetPage() {
  const router = useRouter();
  const [roots, setRoots] = useState<Widget[]>([]);
  const [children, setChildren] = useState<Record<string, Widget[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Widget | null>(null);

  useEffect(() => {
    api.adminWidgets
      .list({ limit: 100 })
      .then((res) => setRoots(res.data ?? []))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra"))
      .finally(() => setLoading(false));
  }, []);

  const loadChildren = useCallback(
    async (parentId: string) => {
      if (children[parentId]) {
        setExpanded((prev) => ({ ...prev, [parentId]: !prev[parentId] }));
        return;
      }
      try {
        const res = await api.adminWidgets.list({ parent_id: parentId, limit: 100 });
        setChildren((prev) => ({ ...prev, [parentId]: res.data ?? [] }));
        setExpanded((prev) => ({ ...prev, [parentId]: true }));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra");
      }
    },
    [children],
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.adminWidgets.remove(deleteTarget.id);
      const targetId = deleteTarget.id;
      const parentId = deleteTarget.parent_id;
      setRoots((prev) => prev.filter((w) => w.id !== targetId));
      setChildren((prev) => {
        const next = { ...prev };
        // remove this widget from its parent's children list
        if (parentId && next[parentId]) {
          next[parentId] = next[parentId].filter((w) => w.id !== targetId);
        }
        // if this was a root container, drop its children cache
        delete next[targetId];
        return next;
      });
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
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

  const renderRow = (w: Widget, isChild = false) => {
    const statusLabel = WIDGET_STATUS_LABEL[w.status] ?? "—";
    const isActive = w.status === 2;
    const hasChildren = w.type === "container";

    return (
      <tr key={w.id} className={`hover:bg-gray-50 ${isChild ? "bg-gray-50/50" : ""}`}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            {isChild ? (
              <span className="w-5 h-5 shrink-0" />
            ) : hasChildren ? (
              <button
                onClick={() => loadChildren(w.id)}
                className="p-0.5 text-gray-500 hover:text-gray-800"
              >
                {expanded[w.id] ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <span className="w-5 h-5 shrink-0" />
            )}
            <span className={`text-sm font-medium text-gray-900 ${isChild ? "ml-4" : ""}`}>
              {w.name}
            </span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          {WIDGET_TYPE_LABEL[w.type] ?? w.type}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
          {w.display_order}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
              isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            {statusLabel}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          {new Date(w.created_at).toLocaleDateString("vi-VN")}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/admin/widgets/${w.id}/edit`)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(w)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

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
                {filteredRoots.map((w) => (
                  <React.Fragment key={w.id}>
                    {renderRow(w)}
                    {expanded[w.id] &&
                      (children[w.id] ?? []).map((child) => renderRow(child, true))}
                  </React.Fragment>
                ))}
                {!loading && filteredRoots.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500 text-sm">
                      Không tìm thấy widget nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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

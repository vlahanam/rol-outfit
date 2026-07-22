"use client";

import { useState, useEffect } from "react";
import { Search, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Tag } from "@/types/api";

function isTagActive(tag: Tag): boolean {
  const now = new Date();
  const startOk = !tag.start_at || new Date(tag.start_at) <= now;
  const endOk = !tag.end_at || new Date(tag.end_at) >= now;
  return startOk && endOk;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN");
}

export default function ListTagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.adminTags
      .list({ limit: 100 })
      .then((res) => setTags(res.data ?? []))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tags.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase());
    const active = isTagActive(t);
    const matchStatus =
      statusFilter === "" ||
      (statusFilter === "active" && active) ||
      (statusFilter === "inactive" && !active);
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Thẻ Tag</h1>
        <p className="text-gray-600 text-sm">Danh sách tất cả thẻ tag</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên hoặc slug..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Hết hạn / chưa bắt đầu</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-500 text-sm">Đang tải...</div>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  {["Tên", "Slug", "Bắt đầu", "Kết thúc", "Trạng thái", "Hành động"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((tag) => {
                  const active = isTagActive(tag);
                  return (
                    <tr key={tag.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tag.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{tag.slug}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{fmtDate(tag.start_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{fmtDate(tag.end_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {active ? "Đang hoạt động" : "Không hoạt động"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => router.push(`/admin/tags/${tag.id}/edit`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500 text-sm">Không tìm thấy thẻ tag nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}

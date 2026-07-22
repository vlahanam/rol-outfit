"use client";

import { useState, useEffect } from "react";
import { Search, Check, X, Trash2, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminReviews } from "@/lib/api-resources";
import type { ProductReview } from "@/types/api";

const STATUS_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700" },
  2: { text: "Đã duyệt", color: "bg-green-100 text-green-700" },
  3: { text: "Từ chối", color: "bg-red-100 text-red-700" },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const limit = 20;

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await adminReviews.list({
        page,
        limit,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setReviews(res.data ?? []);
      setTotal(res.paging?.total ?? 0);
    } catch {
      toast.error("Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await adminReviews.approve(id);
      toast.success("Đã duyệt đánh giá");
      fetchReviews();
    } catch {
      toast.error("Không thể duyệt đánh giá");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await adminReviews.reject(id);
      toast.success("Đã từ chối đánh giá");
      fetchReviews();
    } catch {
      toast.error("Không thể từ chối đánh giá");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    setActionLoading(id);
    try {
      await adminReviews.remove(id);
      toast.success("Đã xóa đánh giá");
      fetchReviews();
    } catch {
      toast.error("Không thể xóa đánh giá");
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Đánh Giá</h1>
        <p className="text-gray-600 text-sm">Duyệt và quản lý đánh giá sản phẩm từ khách hàng</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSearch} className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên sản phẩm hoặc khách hàng..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>Tất cả trạng thái</option>
            <option value={1}>Chờ duyệt</option>
            <option value={2}>Đã duyệt</option>
            <option value={3}>Từ chối</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Tìm kiếm
          </button>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Không có đánh giá nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Sản phẩm</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Khách hàng</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Đánh giá</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Nhận xét</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Ngày</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 max-w-[200px] truncate">
                      {review.product_name || "—"}
                    </td>
                    <td className="px-4 py-3">{review.user_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[300px]">
                      <p className="truncate">{review.comment || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_LABELS[review.status]?.color ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {STATUS_LABELS[review.status]?.text ?? "Không rõ"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {fmtDate(review.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {review.status === 1 && (
                          <>
                            <button
                              onClick={() => handleApprove(review.id)}
                              disabled={actionLoading === review.id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                              title="Duyệt"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(review.id)}
                              disabled={actionLoading === review.id}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded disabled:opacity-50"
                              title="Từ chối"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(review.id)}
                          disabled={actionLoading === review.id}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Hiển thị {(page - 1) * limit + 1}-{Math.min(page * limit, total)} / {total} đánh giá
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, Search, Copy, Loader2 } from "lucide-react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { AdminCartListItem, Paging } from "@/types/api";

function formatCurrency(value: number): string {
  return value.toLocaleString("vi-VN") + "₫";
}

export default function ListCartPage() {
  const [search, setSearch] = useState("");
  const [carts, setCarts] = useState<AdminCartListItem[]>([]);
  const [paging, setPaging] = useState<Paging | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCarts = useCallback(async (page = 1, searchQuery = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminCarts.list({
        page,
        limit: 20,
        search: searchQuery,
      });
      setCarts(res.data);
      setPaging(res.paging ?? null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh sách giỏ hàng");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCarts(1, search);
  }, [fetchCarts, search]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Giỏ Hàng</h1>
        <p className="text-gray-600">Danh sách tất cả giỏ hàng</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm giỏ hàng..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">{error}</div>
        ) : carts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">Không có giỏ hàng nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Mã giỏ hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Thông tin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Số Sản Phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Tổng Tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Cập Nhật
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {carts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-mono text-xs">{cart.id.slice(0, 8)}...</span>
                        <button
                          onClick={() => copyToClipboard(cart.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Sao chép ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {cart.user_full_name || "Không có tên"}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-mono text-xs">ID: {cart.user_id.slice(0, 8)}...</span>
                          <button
                            onClick={() => copyToClipboard(cart.user_id)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Sao chép User ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">
                          Email: {cart.user_email || "N/A"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {cart.item_count} sản phẩm
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-blue-600 whitespace-nowrap">
                      {formatCurrency(cart.total)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {cart.updated_at}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/carts/${cart.id}`}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {paging && paging.total > paging.limit && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Trang {paging.page} / {Math.ceil(paging.total / paging.limit)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchCarts(paging.page - 1, search)}
                disabled={paging.page <= 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => fetchCarts(paging.page + 1, search)}
                disabled={paging.page >= Math.ceil(paging.total / paging.limit)}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
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

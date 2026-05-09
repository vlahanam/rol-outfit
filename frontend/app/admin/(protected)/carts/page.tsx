"use client";

import { useState } from "react";
import { Eye, Trash2, Search, Copy, MapPin } from "lucide-react";
import Link from "next/link";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";

const mockCarts = [
  {
    id: "1",
    userFullName: "Nguyễn Văn A",
    userID: "1",
    userEmail: "nguyenvana@gmail.com",
    items: 3,
    total: "2.160.000₫",
    updatedAt: "12:00 29/04/2026",
  },
  {
    id: "2",
    userFullName: "Trần Thị B",
    userID: "2",
    userEmail: "tranthib@gmail.com",
    items: 1,
    total: "720.000₫",
    updatedAt: "12:00 28/04/2026",
  },
  {
    id: "3",
    userFullName: "Lê Văn C",
    userID: "3",
    userEmail: "levanc@gmail.com",
    items: 5,
    total: "7.800.000₫",
    updatedAt: "12:00 28/04/2026",
  },
  {
    id: "4",
    userFullName: "Phạm Thị D",
    userID: "4",
    userEmail: "phamthid@gmail.com",
    items: 2,
    total: "3.100.000₫",
    updatedAt: "12:00 27/04/2026",
  },
];

export default function ListCartPage() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = mockCarts.filter(
    (c) =>
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.userID.toLowerCase().includes(search.toLowerCase()) ||
      c.userFullName.toLowerCase().includes(search.toLowerCase()) ||
      c.userEmail.toLowerCase().includes(search.toLowerCase()),
  );

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

        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Mã đơn hàng
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
              {filtered.map((cart) => (
                <tr key={cart.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {cart.id}
                      <Copy className="w-4 h-4" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {cart.userFullName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        ID: {cart.userID}
                        <Copy className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Email: {cart.userEmail}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {cart.items} sản phẩm
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-blue-600 whitespace-nowrap">
                    {cart.total}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {cart.updatedAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/carts/${cart.id}`}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteId(cart.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      </div>

      <DeleteConfirmModal
        isOpen={deleteId !== null}
        title="Xóa Giỏ Hàng"
        message="Bạn có chắc chắn muốn xóa giỏ hàng này?"
        onConfirm={() => {
          console.log("Delete cart", deleteId);
          setDeleteId(null);
        }}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

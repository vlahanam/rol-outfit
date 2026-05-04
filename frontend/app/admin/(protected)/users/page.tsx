"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Trash2,
  Plus,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Copy,
} from "lucide-react";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";

const mockUsers = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    email: "nguyenvana@gmail.com",
    phone: "0912345678",
    address: "o1",
    role: "Khách hàng",
    status: "Hoạt động",
    joined: "15/01/2026",
  },
  {
    id: "2",
    name: "Trần Thị B",
    email: "tranthib@gmail.com",
    phone: "0987654321",
    address: "o1",
    role: "Khách hàng",
    status: "Hoạt động",
    joined: "20/02/2026",
  },
  {
    id: "3",
    name: "Lê Văn C",
    email: "levanc@gmail.com",
    phone: "0901234567",
    address: "o1",
    role: "Admin",
    status: "Hoạt động",
    joined: "01/01/2026",
  },
  {
    id: "4",
    name: "Phạm Thị D",
    email: "phamthid@gmail.com",
    phone: "0932145678",
    address: "o1",
    role: "Khách hàng",
    status: "Bị khóa",
    joined: "10/03/2026",
  },
  {
    id: "5",
    name: "Hoàng Văn E",
    email: "hoangvane@gmail.com",
    phone: "0945678901",
    address: "o1",
    role: "Khách hàng",
    status: "Hoạt động",
    joined: "05/04/2026",
  },
];

export default function ListUserPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = mockUsers.filter((u) => {
    const matchSearch =
      u.id.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "" || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản Lý Người Dùng
          </h1>
          <p className="text-gray-600">Danh sách tất cả người dùng</p>
        </div>
        <Link
          href="/admin/users/add"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Thêm Người Dùng
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên, số điện thoại hoặc email..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Hoạt động">Hoạt động</option>
            <option value="Bị khóa">Bị khóa</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Thông tin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Địa chỉ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Vai Trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Trạng Thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        ID: {user.id}
                        <Copy className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-gray-500">
                        Tham gia: {user.joined}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {user.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {user.address}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {user.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${user.status === "Hoạt động" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/users/${user.id}/edit`}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteId(user.id)}
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
        title="Xóa Người Dùng"
        message="Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác."
        onConfirm={() => {
          console.log("Delete user", deleteId);
          setDeleteId(null);
        }}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

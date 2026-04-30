'use client';

import { useState } from 'react';
import { Eye, Search } from 'lucide-react';
import Link from 'next/link';

const mockOrders = [
  { id: 1, customer: 'Nguyễn Văn A', total: '2.160.000₫', status: 'Hoàn thành', date: '29/04/2026' },
  { id: 2, customer: 'Trần Thị B', total: '720.000₫', status: 'Đang giao', date: '29/04/2026' },
  { id: 3, customer: 'Lê Văn C', total: '7.800.000₫', status: 'Chờ xử lý', date: '28/04/2026' },
  { id: 4, customer: 'Phạm Thị D', total: '3.100.000₫', status: 'Đã hủy', date: '27/04/2026' },
  { id: 5, customer: 'Hoàng Văn E', total: '1.500.000₫', status: 'Hoàn thành', date: '27/04/2026' },
];

const statusColors: Record<string, string> = {
  'Hoàn thành': 'bg-green-100 text-green-700',
  'Đang giao': 'bg-blue-100 text-blue-700',
  'Chờ xử lý': 'bg-yellow-100 text-yellow-700',
  'Đã hủy': 'bg-red-100 text-red-700',
};

export default function ListOrderPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = mockOrders.filter((o) => {
    const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || `${o.id}`.includes(search);
    const matchStatus = statusFilter === '' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Đơn Hàng</h1>
        <p className="text-gray-600">Danh sách tất cả đơn hàng</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm đơn hàng..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option>Hoàn thành</option>
            <option>Đang giao</option>
            <option>Chờ xử lý</option>
            <option>Đã hủy</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Mã ĐH</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Khách Hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tổng Tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Trạng Thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Ngày Đặt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">#ORD-{String(order.id).padStart(3, '0')}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{order.customer}</td>
                  <td className="px-6 py-4 text-sm font-medium text-blue-600 whitespace-nowrap">{order.total}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{order.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/admin/orders/${order.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

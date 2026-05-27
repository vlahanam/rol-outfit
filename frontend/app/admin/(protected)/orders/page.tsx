'use client';

import { useState, useEffect } from 'react';
import { Eye, Search } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { ApiResponse, Order } from '@/types/api';

// status code → label
const STATUS_LABEL: Record<number, string> = {
  1: 'Chờ xử lý',
  2: 'Đang giao',
  3: 'Hoàn thành',
  4: 'Đã hủy',
};

const statusColors: Record<string, string> = {
  'Hoàn thành': 'bg-green-100 text-green-700',
  'Đang giao': 'bg-blue-100 text-blue-700',
  'Chờ xử lý': 'bg-yellow-100 text-yellow-700',
  'Đã hủy': 'bg-red-100 text-red-700',
};

export default function ListOrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get<ApiResponse<Order[]>>('/admin/orders?limit=100');
        setOrders(res.data ?? []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filtered = orders.filter((o) => {
    const label = STATUS_LABEL[o.status] ?? '';
    const searchLower = search.toLowerCase();
    const matchSearch =
      (o.order_code?.toLowerCase().includes(searchLower) ?? false) ||
      o.id.toLowerCase().includes(searchLower) ||
      o.phone.includes(search) ||
      o.shipping_address.toLowerCase().includes(searchLower) ||
      (o.user_name?.toLowerCase().includes(searchLower) ?? false) ||
      (o.user_email?.toLowerCase().includes(searchLower) ?? false);
    const matchStatus = statusFilter === '' || label === statusFilter;
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

        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Mã ĐH</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Người Đặt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Địa chỉ giao</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tổng Tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Trạng Thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Ngày Đặt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((order) => {
                  const label = STATUS_LABEL[order.status] ?? 'Không rõ';
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {order.order_code || order.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="space-y-0.5">
                          <div className="font-medium">{order.user_name || '—'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{order.shipping_address}</td>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600 whitespace-nowrap">
                        {order.total_price.toLocaleString('vi-VN')}₫
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusColors[label] ?? 'bg-gray-100 text-gray-700'}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/admin/orders/${order.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


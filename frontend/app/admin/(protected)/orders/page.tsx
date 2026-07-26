'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Search, Calendar, ArrowUpDown, X, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import type { ApiResponse, Order } from '@/types/api';

// status code → label (matches backend models/order.go)
const STATUS_LABEL: Record<number, string> = {
  1: 'Chờ chuyển khoản',
  2: 'Đã báo chuyển khoản',
  3: 'Xác nhận thành công',
  4: 'Đang giao hàng',
  5: 'Hoàn thành',
  6: 'Đã hủy',
  7: 'Yêu cầu hoàn tiền',
  8: 'Đã hoàn tiền',
};

const statusColors: Record<number, string> = {
  1: 'bg-yellow-100 text-yellow-700',
  2: 'bg-cyan-100 text-cyan-700',
  3: 'bg-purple-100 text-purple-700',
  4: 'bg-blue-100 text-blue-700',
  5: 'bg-green-100 text-green-700',
  6: 'bg-red-100 text-red-700',
  7: 'bg-orange-100 text-orange-700',
  8: 'bg-teal-100 text-teal-700',
};

type SortOption = 'newest' | 'oldest' | 'price_high' | 'price_low';

export default function ListOrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setError(null);
        const res = await api.get<ApiResponse<Order[]>>('/admin/orders?limit=100');
        setOrders(res.data ?? []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Không thể tải danh sách đơn hàng';
        setError(message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    let result = orders.filter((o) => {
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

      const orderDate = new Date(o.created_at);
      const matchDateFrom = !dateFrom || orderDate >= new Date(dateFrom);
      const matchDateTo = !dateTo || orderDate <= new Date(dateTo + 'T23:59:59');

      return matchSearch && matchStatus && matchDateFrom && matchDateTo;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price_high':
          return b.total_price - a.total_price;
        case 'price_low':
          return a.total_price - b.total_price;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [orders, search, statusFilter, dateFrom, dateTo, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
  };

  const hasActiveFilters = search || statusFilter || dateFrom || dateTo || sortBy !== 'newest';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Đơn Hàng</h1>
        <p className="text-gray-600">Danh sách tất cả đơn hàng</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200 space-y-4">
          {/* Row 1: Search & Status */}
          <div className="flex flex-col sm:flex-row gap-4">
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
              <option>Chờ chuyển khoản</option>
              <option>Đã báo chuyển khoản</option>
              <option>Xác nhận thành công</option>
              <option>Đang giao hàng</option>
              <option>Hoàn thành</option>
              <option>Đã hủy</option>
              <option>Yêu cầu hoàn tiền</option>
              <option>Đã hoàn tiền</option>
            </select>
          </div>

          {/* Row 2: Date range & Sort */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Từ:</span>
              </div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Đến:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="price_high">Giá cao → thấp</option>
                <option value="price_low">Giá thấp → cao</option>
              </select>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Xóa bộ lọc
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-500">
            Hiển thị {filtered.length} / {orders.length} đơn hàng
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Mã ĐH</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Người Đặt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Địa chỉ giao</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tổng Tiền</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Bill</th>
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
                        {formatPrice(order.total_price, order.currency_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {order.transfer_bill ? (
                          <a href={order.transfer_bill} target="_blank" rel="noopener noreferrer"
                             className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                             title="Xem bill chuyển khoản">
                            <ImageIcon className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
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


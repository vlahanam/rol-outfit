'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { adminDashboard } from '@/lib/api-resources';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import type { DashboardStats } from '@/types/api';
import { formatPrice, getUploadUrl } from '@/lib/format';

function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await adminDashboard.getStats();
        setStats(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">{error || 'Failed to load dashboard'}</p>
      </div>
    );
  }

  const statCards = [
    { icon: DollarSign, label: 'Doanh Thu (JPY)', value: formatPrice(stats.total_revenue_jpy, 1), bgColor: 'bg-red-50', iconColor: 'text-red-600' },
    { icon: DollarSign, label: 'Doanh Thu (VND)', value: formatPrice(stats.total_revenue_vnd, 2), bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    { icon: ShoppingCart, label: 'Đơn Hàng', value: formatNumber(stats.total_orders), bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
    { icon: Users, label: 'Người Dùng', value: formatNumber(stats.total_users), bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { icon: Package, label: 'Sản Phẩm', value: formatNumber(stats.total_products), bgColor: 'bg-orange-50', iconColor: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Tổng quan về hoạt động kinh doanh</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Đơn Hàng Gần Đây</h2>
            <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Mã ĐH</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Khách Hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tổng Tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recent_orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Chưa có đơn hàng nào
                    </td>
                  </tr>
                ) : (
                  stats.recent_orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                          {order.order_code || order.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{order.customer || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{formatPrice(order.total_price, order.currency_type)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <OrderStatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Sản Phẩm Bán Chạy</h2>
            <Link href="/admin/products" className="text-sm text-blue-600 hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="p-6">
            {stats.top_products.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Chưa có dữ liệu bán hàng</p>
            ) : (
              <div className="space-y-4">
                {stats.top_products.map((product) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {getUploadUrl(product.images?.[0]) ?? product.avatar ? (
                        <img
                          src={getUploadUrl(product.images?.[0]) ?? product.avatar}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/admin/products/${product.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block">
                        {product.name}
                      </Link>
                      <p className="text-xs text-gray-500">Đã bán: {formatNumber(product.sold)} sản phẩm</p>
                    </div>
                    <p className="text-sm font-semibold text-blue-600 flex-shrink-0">{formatPrice(product.revenue, product.product_type)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { ApiResponse, Order, Product } from '@/types/api';

interface RichOrderItem {
  id: string;
  product_id: string;
  attr_id?: string;
  price: number;
  quantity: number;
  productName: string;
}

const STATUS_OPTIONS = [
  { value: 1, label: 'Chờ xử lý' },
  { value: 2, label: 'Đã xác nhận' },
  { value: 3, label: 'Đang giao' },
  { value: 4, label: 'Đã giao' },
  { value: 5, label: 'Đã thanh toán' },
  { value: 6, label: 'Đã hủy' },
];

const statusColors: Record<number, string> = {
  1: 'bg-yellow-100 text-yellow-700',
  2: 'bg-purple-100 text-purple-700',
  3: 'bg-blue-100 text-blue-700',
  4: 'bg-green-100 text-green-700',
  5: 'bg-green-100 text-green-700',
  6: 'bg-red-100 text-red-700',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<RichOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get<ApiResponse<Order>>(`/admin/orders/${id}`);
        setOrder(res.data);
        const orderItems = res.data.items ?? [];
        const rich = await Promise.all(
          orderItems.map(async (item) => {
            try {
              const pRes = await api.get<ApiResponse<Product>>(`/products/${item.product_id}`);
              return { ...item, productName: pRes.data.name };
            } catch {
              return { ...item, productName: `Product ${item.product_id.slice(0, 8)}` };
            }
          })
        );
        setItems(rich);
      } catch {
        setError('Không thể tải đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus: number) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await api.put<ApiResponse<Order>>(`/admin/orders/${id}/status`, {
        status: newStatus,
      });
      setOrder(res.data);
    } catch {
      alert('Không thể cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-red-600">{error || 'Không tìm thấy đơn hàng'}</p>
        <Link href="/admin/orders" className="text-blue-600 hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const statusLabel = STATUS_OPTIONS.find((s) => s.value === order.status)?.label ?? 'Không rõ';
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal >= 500000 ? 0 : 30000;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Chi Tiết Đơn Hàng</h1>
          <p className="text-gray-600">
            ID: #{order.id.slice(0, 8).toUpperCase()} —{' '}
            {new Date(order.created_at).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
            {statusLabel}
          </span>
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(Number(e.target.value))}
            disabled={updating}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {updating && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Sản Phẩm</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Sản Phẩm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Đơn Giá</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">SL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{item.productName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.price.toLocaleString('vi-VN')}₫</td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600 whitespace-nowrap">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-gray-200 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span><span>{subtotal.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span><span>{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')}₫`}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
                <span>Tổng cộng</span><span className="text-blue-600">{order.total_price.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Khách Hàng</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">ID:</span> <span className="ml-2">{order.user_id.slice(0, 8).toUpperCase()}</span></div>
              <div><span className="text-gray-500">Số ĐT:</span> <span className="ml-2">{order.phone}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vận Chuyển</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Địa chỉ:</span> <span className="ml-2">{order.shipping_address}</span></div>
              {order.note && <div><span className="text-gray-500">Ghi chú:</span> <span className="ml-2">{order.note}</span></div>}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thanh Toán</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Phương thức:</span> <span className="ml-2">Thanh toán khi nhận hàng</span></div>
              <div>
                <span className="text-gray-500">Trạng thái:</span>
                <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${order.status === 5 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {order.status === 5 ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

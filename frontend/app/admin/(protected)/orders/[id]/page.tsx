'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';
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
  { value: 1, label: 'Chờ chuyển khoản' },
  { value: 2, label: 'Đã báo chuyển khoản' },
  { value: 3, label: 'Xác nhận thành công' },
  { value: 4, label: 'Đang giao hàng' },
  { value: 5, label: 'Hoàn thành' },
  { value: 6, label: 'Đã hủy' },
  { value: 7, label: 'Yêu cầu hoàn tiền' },
  { value: 8, label: 'Đã hoàn tiền' },
];

const VALID_TRANSITIONS: Record<number, number[]> = {
  1: [2, 6],      // AWAITING_PAYMENT → PAYMENT_SUBMITTED, CANCELLED
  2: [3, 1, 6],   // PAYMENT_SUBMITTED → CONFIRMED, AWAITING_PAYMENT, CANCELLED
  3: [4, 6],      // CONFIRMED → SHIPPING, CANCELLED
  4: [5, 6],      // SHIPPING → COMPLETED, CANCELLED
  5: [7],         // COMPLETED → REFUND_REQUESTED
  6: [8],         // CANCELLED → REFUNDED
  7: [8, 5],      // REFUND_REQUESTED → REFUNDED, COMPLETED (reject)
  8: [],          // REFUNDED → terminal
};

const getValidStatusOptions = (currentStatus: number) => {
  const validIds = VALID_TRANSITIONS[currentStatus] || [];
  return STATUS_OPTIONS.filter(s => validIds.includes(s.value));
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

const ORDER_STATUS_PAYMENT_SUBMITTED = 2;
const ORDER_STATUS_CONFIRMED = 3;
const ORDER_STATUS_COMPLETED = 5;
const ORDER_STATUS_CANCELLED = 6;
const ORDER_STATUS_REFUND_REQUESTED = 7;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<RichOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

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
    setStatusError(null);
    try {
      const res = await api.put<ApiResponse<Order>>(`/admin/orders/${id}/status`, {
        status: newStatus,
      });
      setOrder(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật trạng thái';
      setStatusError(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRefundCancelled = async () => {
    if (!order || !confirm('Xác nhận hoàn tiền cho đơn hàng đã hủy?')) return;
    setRefunding(true);
    setStatusError(null);
    try {
      await api.put(`/admin/orders/${id}/refund-cancelled`);
      const res = await api.get<ApiResponse<Order>>(`/admin/orders/${id}`);
      setOrder(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Hoàn tiền thất bại';
      setStatusError(message);
    } finally {
      setRefunding(false);
    }
  };

  const handleRefundAction = async (approve: boolean) => {
    if (!order) return;
    const endpoint = approve
      ? `/admin/orders/${id}/approve-refund`
      : `/admin/orders/${id}/reject-refund`;

    setRefunding(true);
    setStatusError(null);
    try {
      await api.put(endpoint, approve ? {} : { reason: 'Từ chối bởi admin' });
      const res = await api.get<ApiResponse<Order>>(`/admin/orders/${id}`);
      setOrder(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Thao tác thất bại';
      setStatusError(message);
    } finally {
      setRefunding(false);
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
  const shippingFee = order.shipping_cost ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Chi Tiết Đơn Hàng</h1>
          <p className="text-gray-600">
            {order.order_code || `#${order.id.slice(0, 8)}`} —{' '}
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
            disabled={updating || getValidStatusOptions(order.status).length === 0}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value={order.status} disabled>
              {STATUS_OPTIONS.find(s => s.value === order.status)?.label}
            </option>
            {getValidStatusOptions(order.status).map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {updating && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
        </div>
        {statusError && (
          <div className="text-red-600 text-sm mt-2">{statusError}</div>
        )}
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
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{formatPrice(item.price, order.currency_type)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600 whitespace-nowrap">{formatPrice(item.price * item.quantity, order.currency_type)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-gray-200 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span><span>{formatPrice(subtotal, order.currency_type)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span><span>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee, order.currency_type)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
                <span>Tổng cộng</span><span className="text-blue-600">{formatPrice(order.total_price, order.currency_type)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Khách Hàng</h2>
            <div className="space-y-2 text-sm">
              {order.user_name && <div><span className="text-gray-500">Tên:</span> <span className="ml-2 font-medium">{order.user_name}</span></div>}
              {order.user_email && <div><span className="text-gray-500">Email:</span> <span className="ml-2">{order.user_email}</span></div>}
              <div><span className="text-gray-500">Số ĐT:</span> <span className="ml-2">{order.phone}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vận Chuyển</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Địa chỉ:</span> <span className="ml-2">{order.shipping_address}</span></div>
              {order.postal_code && <div><span className="text-gray-500">Mã bưu điện:</span> <span className="ml-2">{order.postal_code}</span></div>}
              {order.note && <div><span className="text-gray-500">Ghi chú:</span> <span className="ml-2">{order.note}</span></div>}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thanh Toán</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Phương thức:</span> <span className="ml-2">Chuyển khoản ngân hàng</span></div>
              <div>
                <span className="text-gray-500">Trạng thái:</span>
                <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                  order.status === 8 ? 'bg-teal-100 text-teal-700' :
                  order.status === 7 ? 'bg-orange-100 text-orange-700' :
                  order.status >= 3 && order.status <= 5 ? 'bg-green-100 text-green-700' :
                  order.status === 2 ? 'bg-cyan-100 text-cyan-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.status === 8 ? 'Đã hoàn tiền' :
                   order.status === 7 ? 'Chờ hoàn tiền' :
                   order.status >= 3 && order.status <= 5 ? 'Đã thanh toán' :
                   order.status === 2 ? 'Đã báo chuyển khoản' :
                   'Chưa thanh toán'}
                </span>
              </div>
              {order.transfer_bill && (
                <div className="mt-3">
                  <span className="text-gray-500 text-sm">Bill chuyển khoản:</span>
                  <a href={order.transfer_bill} target="_blank" rel="noopener noreferrer"
                     className="mt-1 block border border-gray-200 rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
                    <img src={order.transfer_bill} alt="Bill chuyển khoản" className="w-full h-auto max-h-48 object-contain bg-gray-50" />
                  </a>
                </div>
              )}
            </div>
            {order.status === ORDER_STATUS_PAYMENT_SUBMITTED && (
              <button
                onClick={() => handleStatusChange(ORDER_STATUS_CONFIRMED)}
                disabled={updating}
                className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận thanh toán'}
              </button>
            )}
            {order.status === ORDER_STATUS_CANCELLED && (
              <button
                onClick={handleRefundCancelled}
                disabled={refunding}
                className="mt-4 w-full bg-yellow-600 text-white py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {refunding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hoàn tiền đơn đã hủy'}
              </button>
            )}
            {order.status === ORDER_STATUS_REFUND_REQUESTED && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-orange-700 font-medium">Khách yêu cầu hoàn tiền</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRefundAction(true)}
                    disabled={refunding}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {refunding ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Xác nhận hoàn tiền'}
                  </button>
                  <button
                    onClick={() => handleRefundAction(false)}
                    disabled={refunding}
                    className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

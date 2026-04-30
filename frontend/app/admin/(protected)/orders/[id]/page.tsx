'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const mockOrder = {
  id: 1,
  status: 'Đang giao',
  date: '29/04/2026 10:15',
  customer: { name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', phone: '0912345678' },
  shipping: { address: '123 Đường ABC, Quận 1, TP.HCM', method: 'Giao hàng nhanh' },
  payment: { method: 'Thanh toán khi nhận hàng', status: 'Chưa thanh toán' },
  items: [
    { id: 1, product: 'Áo Thun Cotton Premium', variant: 'Trắng / S', price: '720.000₫', quantity: 2, subtotal: '1.440.000₫' },
    { id: 2, product: 'Quần Jeans Denim', variant: 'Xanh / 30', price: '1.560.000₫', quantity: 1, subtotal: '1.560.000₫' },
  ],
  subtotal: '3.000.000₫',
  shippingFee: '30.000₫',
  total: '3.030.000₫',
};

const statuses = ['Chờ xử lý', 'Đang xử lý', 'Đang giao', 'Hoàn thành', 'Đã hủy'];

const statusColors: Record<string, string> = {
  'Hoàn thành': 'bg-green-100 text-green-700',
  'Đang giao': 'bg-blue-100 text-blue-700',
  'Chờ xử lý': 'bg-yellow-100 text-yellow-700',
  'Đang xử lý': 'bg-purple-100 text-purple-700',
  'Đã hủy': 'bg-red-100 text-red-700',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState(mockOrder.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Chi Tiết Đơn Hàng</h1>
          <p className="text-gray-600">ID: #ORD-{String(id).padStart(3, '0')} — {mockOrder.date}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[status] ?? 'bg-gray-100 text-gray-700'}`}>{status}</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </select>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Biến Thể</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Đơn Giá</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">SL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockOrder.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{item.product}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{item.variant}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.price}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600 whitespace-nowrap">{item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-gray-200 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span><span>{mockOrder.subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span><span>{mockOrder.shippingFee}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
                <span>Tổng cộng</span><span className="text-blue-600">{mockOrder.total}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Khách Hàng</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Họ tên:</span> <span className="font-medium ml-2">{mockOrder.customer.name}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="ml-2">{mockOrder.customer.email}</span></div>
              <div><span className="text-gray-500">Số ĐT:</span> <span className="ml-2">{mockOrder.customer.phone}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vận Chuyển</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Địa chỉ:</span> <span className="ml-2">{mockOrder.shipping.address}</span></div>
              <div><span className="text-gray-500">Phương thức:</span> <span className="ml-2">{mockOrder.shipping.method}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thanh Toán</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Phương thức:</span> <span className="ml-2">{mockOrder.payment.method}</span></div>
              <div>
                <span className="text-gray-500">Trạng thái:</span>
                <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${mockOrder.payment.status === 'Đã thanh toán' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {mockOrder.payment.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

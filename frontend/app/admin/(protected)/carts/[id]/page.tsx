'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const mockCart = {
  id: 1,
  customer: { name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', phone: '0912345678', address: '123 Đường ABC, TP.HCM' },
  items: [
    { id: 1, product: 'Áo Thun Cotton Premium', variant: 'Trắng / S', price: '720.000₫', quantity: 2, subtotal: '1.440.000₫' },
    { id: 2, product: 'Quần Jeans Denim', variant: 'Xanh / 30', price: '1.560.000₫', quantity: 1, subtotal: '1.560.000₫' },
    { id: 3, product: 'Giày Thể Thao', variant: 'Trắng / 42', price: '1.900.000₫', quantity: 1, subtotal: '1.900.000₫' },
  ],
  total: '4.900.000₫',
  updatedAt: '29/04/2026 14:30',
};

export default function CartDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/carts" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chi Tiết Giỏ Hàng</h1>
          <p className="text-gray-600">ID: #{id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Sản Phẩm Trong Giỏ</h2>
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
                  {mockCart.items.map((item) => (
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
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông Tin Khách Hàng</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Họ tên:</span>
                <span className="font-medium ml-2">{mockCart.customer.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2">{mockCart.customer.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Số ĐT:</span>
                <span className="ml-2">{mockCart.customer.phone}</span>
              </div>
              <div>
                <span className="text-gray-500">Địa chỉ:</span>
                <span className="ml-2">{mockCart.customer.address}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tóm Tắt</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Cập nhật lần cuối</span>
                <span>{mockCart.updatedAt}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-3 border-t border-gray-200">
                <span>Tổng tiền</span>
                <span className="text-blue-600">{mockCart.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

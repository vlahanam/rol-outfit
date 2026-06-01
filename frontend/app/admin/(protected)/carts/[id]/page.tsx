"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { AdminCartDetail } from "@/types/api";

function formatCurrency(value: number): string {
  return value.toLocaleString("vi-VN") + "₫";
}

function parseAttributes(attrJson: string): string {
  if (!attrJson) return "";
  try {
    const attrs = JSON.parse(attrJson);
    if (typeof attrs === "object" && attrs !== null) {
      return Object.values(attrs).join(" / ");
    }
    return attrJson;
  } catch {
    return attrJson;
  }
}

export default function CartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [cart, setCart] = useState<AdminCartDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCart = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.adminCarts.get(id);
        setCart(res.data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Không thể tải thông tin giỏ hàng");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !cart) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/carts" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chi Tiết Giỏ Hàng</h1>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 text-center text-red-600">
          {error || "Không tìm thấy giỏ hàng"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/carts" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chi Tiết Giỏ Hàng</h1>
          <p className="text-gray-600 font-mono text-sm">ID: {cart.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Sản Phẩm Trong Giỏ ({cart.items.length})
              </h2>
            </div>
            {cart.items.length === 0 ? (
              <div className="p-6 text-center text-gray-500">Giỏ hàng trống</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                        Sản Phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                        Biến Thể
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                        Đơn Giá
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                        SL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                        Thành Tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cart.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {item.product_image && (
                              <Image
                                src={item.product_image}
                                alt={item.product_name}
                                width={40}
                                height={40}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {item.product_name || "Sản phẩm không tồn tại"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {item.attr_name ? parseAttributes(item.attr_name) : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {formatCurrency(item.price_at_add)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-blue-600 whitespace-nowrap">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông Tin Khách Hàng</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Họ tên:</span>
                <span className="font-medium ml-2">{cart.user_full_name || "Không có tên"}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2">{cart.user_email || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-500">User ID:</span>
                <span className="ml-2 font-mono text-xs">{cart.user_id}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tóm Tắt</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Ngày tạo</span>
                <span>{cart.created_at}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Cập nhật lần cuối</span>
                <span>{cart.updated_at}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-3 border-t border-gray-200">
                <span>Tổng tiền</span>
                <span className="text-blue-600">{formatCurrency(cart.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

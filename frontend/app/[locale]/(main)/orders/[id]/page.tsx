"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Package } from "lucide-react";
import { Footer } from "@/components/Footer";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import type { ApiResponse, Order, Product } from "@/types/api";

interface RichOrderItem {
  id: string;
  product_id: string;
  attr_id?: string;
  price: number;
  quantity: number;
  productName: string;
  productImage: string;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400";

export default function OrderDetailPage() {
  const t = useTranslations("OrderDetailPage");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<RichOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    const fetchOrder = async () => {
      try {
        const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
        setOrder(res.data);
        const orderItems = res.data.items ?? [];
        const rich = await Promise.all(
          orderItems.map(async (item) => {
            try {
              const pRes = await api.get<ApiResponse<Product>>(
                `/products/${item.product_id}`
              );
              return {
                ...item,
                productName: pRes.data.name,
                productImage: pRes.data.avatar || FALLBACK_IMG,
              };
            } catch {
              return {
                ...item,
                productName: item.product_id,
                productImage: FALLBACK_IMG,
              };
            }
          })
        );
        setItems(rich);
      } catch {
        setError(tCommon("errorLoading"));
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [router, id, tCommon]);

  const handleCancel = async () => {
    if (!confirm(t("cancelConfirm"))) return;
    setCancelling(true);
    try {
      await api.delete(`/orders/${id}`);
      router.push("/orders");
    } catch {
      alert(t("cancelFailed"));
      setCancelling(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 500000 ? 0 : 30000;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{tCommon("loading")}</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-6">{error || tCommon("errorLoading")}</p>
            <Link
              href="/orders"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {tCommon("backToHome")}
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/orders"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{tCommon("backToHome")}</span>
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-gray-500 mt-1">
              #{order.id.slice(0, 8).toUpperCase()} -{" "}
              {new Date(order.created_at).toLocaleDateString(locale === "jp" ? "ja-JP" : "vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">{t("items")}</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-gray-500">x{item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">{t("shippingInfo")}</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">{t("address")}:</span>
                  <span className="ml-2">{order.shipping_address}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t("phone")}:</span>
                  <span className="ml-2">{order.phone}</span>
                </div>
                {order.note && (
                  <div>
                    <span className="text-gray-500">{t("note")}:</span>
                    <span className="ml-2">{order.note}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">{t("orderSummary")}</h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>{t("subtotal")}</span>
                  <span>{subtotal.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t("shipping")}</span>
                  <span>
                    {shipping === 0
                      ? t("free")
                      : `${shipping.toLocaleString("vi-VN")}₫`}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">{t("total")}</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {order.total_price.toLocaleString("vi-VN")}₫
                  </span>
                </div>
              </div>
            </div>

            {order.status === 1 && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {tCommon("loading")}
                  </>
                ) : (
                  t("cancelOrder")
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ShoppingBag, Loader2 } from "lucide-react";
import { Footer } from "@/components/Footer";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useCart } from "@/context/cart-context";
import { createCheckoutSchema } from "@/lib/validations";
import type { ApiResponse, Cart, CartItem, Product, Order } from "@/types/api";

interface RichCartItem extends CartItem {
  productName: string;
  productImage: string;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400";

export default function CheckoutPage() {
  const t = useTranslations("CheckoutPage");
  const tVal = useTranslations("Validation");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { clearCart } = useCart();
  const [cartItems, setCartItems] = useState<RichCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkoutSchema = createCheckoutSchema((key) => tVal(key));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
  });

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    const fetchCart = async () => {
      try {
        const res = await api.get<ApiResponse<Cart>>("/cart");
        const items = res.data?.items ?? [];
        if (items.length === 0) {
          router.push("/cart");
          return;
        }
        const rich = await Promise.all(
          items.map(async (item) => {
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
        setCartItems(rich);
      } catch {
        router.push("/cart");
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [router]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price_at_add * item.quantity,
    0
  );
  const shipping = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shipping;

  const onSubmit = async (data: { shipping_address: string; phone: string; note?: string }) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<ApiResponse<Order>>("/orders", {
        shipping_address: data.shipping_address,
        phone: data.phone,
        note: data.note || undefined,
      });
      clearCart();
      router.push(`/checkout/success?orderId=${res.data.id}`);
    } catch {
      setError(tCommon("errorLoading"));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{tCommon("loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/cart"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{tCommon("backToHome")}</span>
        </Link>

        <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">{t("shippingInfo")}</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("shippingAddress")} *
                    </label>
                    <textarea
                      {...register("shipping_address")}
                      rows={3}
                      placeholder={t("addressPlaceholder")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.shipping_address && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.shipping_address.message as string}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("phone")} *
                    </label>
                    <input
                      type="tel"
                      {...register("phone")}
                      placeholder={t("phonePlaceholder")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone.message as string}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("note")}
                    </label>
                    <textarea
                      {...register("note")}
                      rows={2}
                      placeholder={t("notePlaceholder")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">{t("orderItems")}</h2>
                <div className="space-y-4">
                  {cartItems.map((item) => (
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
                        <p className="text-sm text-gray-500">
                          x{item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">
                        {(item.price_at_add * item.quantity).toLocaleString("vi-VN")}₫
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
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

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">{t("total")}</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {total.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("submitting")}
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      {t("placeOrder")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, ImageIcon } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useCart } from "@/context/cart-context";
import type { ApiResponse, Cart, CartItem, Product } from "@/types/api";

interface RichCartItem extends CartItem {
  productName: string;
  productImage?: string;
  variantName?: string;
}

export default function CartPage() {
  const t = useTranslations("CartPage");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const locale = useLocale();
  const [cartItems, setCartItems] = useState<RichCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { incrementCart, decrementCart } = useCart();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    const fetchCart = async () => {
      try {
        const res = await api.get<ApiResponse<Cart>>("/cart", locale);
        const items = res.data?.items ?? [];
        // Enrich items with product and variant info
        const rich = await Promise.all(
          items.map(async (item) => {
            try {
              const pRes = await api.get<ApiResponse<Product>>(
                `/products/${item.product_id}`,
                locale,
              );
              let variantName: string | undefined;
              if (item.attr_id) {
                try {
                  const vRes = await api.get<ApiResponse<{ attributes: Record<string, string> }>>(
                    `/products/${item.product_id}/variants/${item.attr_id}`,
                    locale,
                  );
                  if (vRes.data?.attributes) {
                    variantName = Object.values(vRes.data.attributes).join(", ");
                  }
                } catch {
                  // ignore variant fetch error
                }
              }
              return {
                ...item,
                productName: pRes.data.name,
                productImage: pRes.data.avatar,
                variantName,
              };
            } catch {
              return {
                ...item,
                productName: item.product_id,
                productImage: undefined,
              };
            }
          }),
        );
        setCartItems(rich);
      } catch {
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [router, locale]);

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    try {
      await api.put(`/cart/items/${id}`, { quantity: newQuantity });
      const diff = newQuantity - item.quantity;
      if (diff > 0) incrementCart(diff);
      else if (diff < 0) decrementCart(-diff);
      setCartItems((items) =>
        items.map((i) => (i.id === id ? { ...i, quantity: newQuantity } : i)),
      );
    } catch {
      // ignore
    }
  };

  const removeItem = async (id: string) => {
    const item = cartItems.find((i) => i.id === id);
    try {
      await api.delete(`/cart/items/${id}`);
      if (item) decrementCart(item.quantity);
      setCartItems((items) => items.filter((i) => i.id !== id));
    } catch {
      // ignore
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price_at_add * item.quantity,
    0,
  );
  const shipping = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shipping;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{tCommon("backToHome")}</span>
        </Link>

        <h1 className="text-3xl font-bold mb-8">
          {t("title")} ({cartItems.length})
        </h1>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            {tCommon("loading")}
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">{t("empty")}</h2>
            <p className="text-gray-600 mb-6">{t("emptyDesc")}</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t("continueShopping")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm">
                {cartItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-6 flex gap-4 ${index !== cartItems.length - 1 ? "border-b border-gray-200" : ""}`}
                  >
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-2">
                          {item.productName}
                        </h3>
                        {item.variantName && (
                          <p className="text-sm text-gray-500 mt-1">
                            {item.variantName}
                          </p>
                        )}
                        <p className="text-lg font-bold text-blue-600 mt-1">
                          {(item.price_at_add * item.quantity).toLocaleString(
                            "vi-VN",
                          )}
                          ₫
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
                  {subtotal < 500000 && (
                    <p className="text-sm text-blue-600">
                      Mua thêm {(500000 - subtotal).toLocaleString("vi-VN")}₫ để
                      được miễn phí vận chuyển
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">{t("total")}</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {total.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full block text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-3"
                >
                  {t("checkout")}
                </Link>

                <Link
                  href="/"
                  className="w-full block text-center border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  {t("continueShopping")}
                </Link>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold mb-3 text-sm">
                    Chính sách mua hàng
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                      Miễn phí vận chuyển cho đơn từ 500.000₫
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                      Đổi trả trong vòng 7 ngày
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                      Thanh toán an toàn & bảo mật
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

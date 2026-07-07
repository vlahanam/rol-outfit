"use client";

import { useState, useEffect, useMemo } from "react";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, ImageIcon, AlertCircle } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useCart } from "@/context/cart-context";
import type { ApiResponse, Cart, CartItem, Product } from "@/types/api";
import { formatPrice, getCartCurrencyType, PRODUCT_TYPE_JAPANESE, PRODUCT_TYPE_VIETNAMESE } from "@/lib/format";

interface RichCartItem extends CartItem {
  productName: string;
  productImage?: string;
  variantName?: string;
  shippingCost: number;
  productType: number;
}

export default function CartPage() {
  const t = useTranslations("CartPage");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const locale = useLocale();
  const [cartItems, setCartItems] = useState<RichCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { incrementCart, decrementCart } = useCart();

  const selectedItems = useMemo(
    () => cartItems.filter((item) => selectedIds.has(item.id)),
    [cartItems, selectedIds]
  );

  const selectedProductType = useMemo(() => {
    if (selectedItems.length === 0) return null;
    return selectedItems[0].productType;
  }, [selectedItems]);

  const toggleSelectItem = (item: RichCartItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        if (selectedProductType !== null && item.productType !== selectedProductType) {
          return prev;
        }
        next.add(item.id);
      }
      return next;
    });
  };

  const canSelectItem = (item: RichCartItem) => {
    if (selectedProductType === null) return true;
    return item.productType === selectedProductType;
  };

  const selectAllSameType = (productType: number) => {
    const ids = cartItems
      .filter((item) => item.productType === productType)
      .map((item) => item.id);
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

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
                shippingCost: pRes.data.shipping_cost ?? 0,
                productType: pRes.data.product_type ?? 2,
              };
            } catch {
              return {
                ...item,
                productName: item.product_id,
                productImage: undefined,
                shippingCost: 0,
                productType: 2,
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

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price_at_add * item.quantity,
    0,
  );
  const shipping = selectedItems.reduce(
    (sum, item) => sum + item.shippingCost * item.quantity,
    0,
  );
  const total = subtotal + shipping;
  const cartCurrencyType = getCartCurrencyType(selectedItems);

  const japaneseItems = cartItems.filter((i) => i.productType === PRODUCT_TYPE_JAPANESE);
  const vietnameseItems = cartItems.filter((i) => i.productType === PRODUCT_TYPE_VIETNAMESE);

  const handleCheckout = () => {
    if (selectedItems.length === 0) return;
    sessionStorage.setItem("checkoutItems", JSON.stringify(Array.from(selectedIds)));
    router.push("/checkout");
  };

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
            <div className="lg:col-span-2 space-y-4">
              {japaneseItems.length > 0 && vietnameseItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium">{t("mixedCartWarning")}</p>
                    <p className="mt-1">{t("mixedCartHint")}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {japaneseItems.length > 0 && (
                  <button
                    onClick={() => selectAllSameType(PRODUCT_TYPE_JAPANESE)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      selectedProductType === PRODUCT_TYPE_JAPANESE
                        ? "bg-red-100 border-red-300 text-red-700"
                        : "border-gray-300 text-gray-600 hover:border-red-300"
                    }`}
                  >
                    {t("selectAllJapanese")} ({japaneseItems.length})
                  </button>
                )}
                {vietnameseItems.length > 0 && (
                  <button
                    onClick={() => selectAllSameType(PRODUCT_TYPE_VIETNAMESE)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      selectedProductType === PRODUCT_TYPE_VIETNAMESE
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "border-gray-300 text-gray-600 hover:border-blue-300"
                    }`}
                  >
                    {t("selectAllVietnamese")} ({vietnameseItems.length})
                  </button>
                )}
                {selectedIds.size > 0 && (
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1.5 text-sm rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {t("clearSelection")}
                  </button>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm">
                {cartItems.map((item, index) => {
                  const isSelected = selectedIds.has(item.id);
                  const canSelect = canSelectItem(item);
                  const isJapanese = item.productType === PRODUCT_TYPE_JAPANESE;

                  return (
                    <div
                      key={item.id}
                      className={`p-6 flex gap-4 ${index !== cartItems.length - 1 ? "border-b border-gray-200" : ""} ${
                        !canSelect ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(item)}
                          disabled={!canSelect && !isSelected}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                        <span
                          className={`absolute top-1 left-1 px-1.5 py-0.5 text-xs font-medium rounded ${
                            isJapanese
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isJapanese ? "JP" : "VN"}
                        </span>
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
                            {formatPrice(item.price_at_add * item.quantity, item.productType)}
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
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">{t("orderSummary")}</h2>

                {selectedIds.size === 0 ? (
                  <p className="text-gray-500 text-sm mb-4">{t("selectItemsHint")}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      {t("selectedItems", { count: selectedIds.size })}
                    </p>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-gray-600">
                        <span>{t("subtotal")}</span>
                        <span>{formatPrice(subtotal, cartCurrencyType)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>{t("shipping")}</span>
                        <span>
                          {shipping === 0
                            ? t("free")
                            : formatPrice(shipping, cartCurrencyType)}
                        </span>
                      </div>
                      {cartCurrencyType !== PRODUCT_TYPE_JAPANESE && subtotal < 500000 && (
                        <p className="text-sm text-blue-600">
                          Mua thêm {formatPrice(500000 - subtotal, cartCurrencyType)} để
                          được miễn phí vận chuyển
                        </p>
                      )}
                    </div>

                    <div className="border-t border-gray-200 pt-4 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">{t("total")}</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatPrice(total, cartCurrencyType)}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={selectedIds.size === 0}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("checkout")}
                </button>

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

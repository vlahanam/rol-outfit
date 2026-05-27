"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ShoppingBag, Loader2, MapPin, Check, X } from "lucide-react";
import { Footer } from "@/components/Footer";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { userAddresses } from "@/lib/api-resources";
import { isLoggedIn } from "@/lib/auth";
import { useCart } from "@/context/cart-context";
import type { ApiResponse, Cart, CartItem, Product, Order, UserAddress } from "@/types/api";

interface RichCartItem extends CartItem {
  productName: string;
  productImage: string;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400";

export default function CheckoutPage() {
  const t = useTranslations("CheckoutPage");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { clearCart } = useCart();
  const [cartItems, setCartItems] = useState<RichCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    const fetchData = async () => {
      try {
        const [cartRes, addressRes] = await Promise.all([
          api.get<ApiResponse<Cart>>("/cart"),
          userAddresses.list().catch(() => ({ data: [] })),
        ]);

        const items = cartRes.data?.items ?? [];
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

        const addrList = addressRes.data ?? [];
        setAddresses(addrList);
        const defAddr = addrList.find((a) => a.is_default) || addrList[0];
        if (defAddr) {
          setSelectedAddress(defAddr);
        }
      } catch {
        router.push("/cart");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price_at_add * item.quantity,
    0
  );
  const shipping = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddress) {
      setError(t("pleaseSelectAddress"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<ApiResponse<Order>>("/orders", {
        shipping_address: selectedAddress.address,
        phone: selectedAddress.phone,
        note: note || undefined,
      });
      clearCart();
      router.push(`/checkout/success?orderId=${res.data.id}`);
    } catch {
      setError(tCommon("errorLoading"));
      setSubmitting(false);
    }
  };

  const handleSelectAddress = (addr: UserAddress) => {
    setSelectedAddress(addr);
    setShowAddressModal(false);
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

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{t("shippingInfo")}</h2>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(true)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <MapPin className="w-4 h-4" />
                      {t("changeAddress")}
                    </button>
                  )}
                </div>

                {selectedAddress ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="font-semibold text-gray-900">{selectedAddress.recipient_name}</p>
                      <p>{selectedAddress.phone}</p>
                      <p>{selectedAddress.address}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-700 text-sm">
                      {t("noAddressSelected")}
                      <Link href="/addresses" className="text-blue-600 hover:underline ml-1">
                        {t("addNewAddress")}
                      </Link>
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("note")}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder={t("notePlaceholder")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                  disabled={submitting || !selectedAddress}
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

      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">{t("selectAddress")}</h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96 space-y-3">
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => handleSelectAddress(addr)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    selectedAddress?.id === addr.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">
                        {addr.recipient_name}
                        {addr.is_default && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                            {t("default")}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">{addr.phone}</p>
                      <p className="text-sm text-gray-600">{addr.address}</p>
                    </div>
                    {selectedAddress?.id === addr.id && (
                      <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t">
              <Link
                href="/addresses"
                className="block w-full text-center text-blue-600 hover:text-blue-700 font-medium"
              >
                {t("manageAddresses")}
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

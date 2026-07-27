"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Package, ShoppingBag, AlertTriangle } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { api } from "@/lib/api";
import type { ApiResponse, Order } from "@/types/api";

const ORDER_STATUS_AWAITING_PAYMENT = 1;

export default function CheckoutSuccessPage() {
  const t = useTranslations("CheckoutSuccessPage");
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [mounted, setMounted] = useState(false);
  const [isAwaitingPayment, setIsAwaitingPayment] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    if (!orderId) {
      router.push("/");
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await api.get<ApiResponse<Order>>(`/orders/${orderId}`, locale);
        if (res.data?.status === ORDER_STATUS_AWAITING_PAYMENT) {
          setIsAwaitingPayment(true);
        }
      } catch {
        // Order fetch failed, don't show warning
      }
    };
    fetchOrder();
  }, [router, orderId, locale]);

  if (!mounted || !orderId) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("title")}
          </h1>
          <p className="text-gray-600 mb-6">{t("thankYou")}</p>

          {isAwaitingPayment && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3 text-left">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">{t("paymentReminder")}</p>
                <p className="text-sm text-amber-700 mt-1">{t("paymentReminderDesc")}</p>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-500 mb-1">{t("orderNumber")}</p>
            <p className="text-xl font-bold text-blue-600 uppercase">
              #{orderId.slice(0, 8)}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/orders"
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Package className="w-5 h-5" />
              {t("viewOrders")}
            </Link>
            <Link
              href="/shop"
              className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {t("continueShopping")}
            </Link>
          </div>
        </div>
      </div>
  );
}

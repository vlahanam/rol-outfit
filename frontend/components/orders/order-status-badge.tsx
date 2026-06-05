"use client";

import { useTranslations } from "next-intl";

interface Props {
  status: number;
}

const STATUS_STYLES: Record<number, string> = {
  1: "bg-yellow-100 text-yellow-700",
  2: "bg-purple-100 text-purple-700",
  3: "bg-blue-100 text-blue-700",
  4: "bg-green-100 text-green-700",
  5: "bg-green-100 text-green-700",
  6: "bg-red-100 text-red-700",
  7: "bg-orange-100 text-orange-700",
  8: "bg-cyan-100 text-cyan-700",
};

const STATUS_KEYS: Record<number, string> = {
  1: "pending",
  2: "confirmed",
  3: "shipped",
  4: "delivered",
  5: "paid",
  6: "cancelled",
  7: "awaitingPayment",
  8: "paymentSubmitted",
};

export function OrderStatusBadge({ status }: Props) {
  const t = useTranslations("OrderStatus");
  const key = STATUS_KEYS[status] ?? "pending";
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700";

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>
      {t(key)}
    </span>
  );
}

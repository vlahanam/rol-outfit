"use client";

import { useTranslations } from "next-intl";

interface Props {
  status: number;
}

const STATUS_STYLES: Record<number, string> = {
  1: "bg-orange-100 text-orange-700",   // AWAITING_PAYMENT
  2: "bg-cyan-100 text-cyan-700",       // PAYMENT_SUBMITTED
  3: "bg-blue-100 text-blue-700",       // CONFIRMED
  4: "bg-purple-100 text-purple-700",   // SHIPPING
  5: "bg-green-100 text-green-700",     // COMPLETED
  6: "bg-red-100 text-red-700",         // CANCELLED
  7: "bg-yellow-100 text-yellow-700",   // REFUND_REQUESTED
  8: "bg-gray-100 text-gray-700",       // REFUNDED
};

const STATUS_KEYS: Record<number, string> = {
  1: "awaitingPayment",
  2: "paymentSubmitted",
  3: "confirmed",
  4: "shipping",
  5: "completed",
  6: "cancelled",
  7: "refundRequested",
  8: "refunded",
};

export function OrderStatusBadge({ status }: Props) {
  const t = useTranslations("OrderStatus");
  const key = STATUS_KEYS[status] ?? "awaitingPayment";
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700";

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>
      {t(key)}
    </span>
  );
}

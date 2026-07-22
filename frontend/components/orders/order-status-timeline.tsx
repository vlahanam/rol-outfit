"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/lib/api";
import { Clock } from "lucide-react";

interface HistoryItem {
  id: string;
  from_status?: number;
  to_status: number;
  note?: string;
  created_at: string;
}

interface Props {
  orderId: string;
}

const STATUS_LABELS: Record<number, string> = {
  1: "awaitingPayment",
  2: "paymentSubmitted",
  3: "confirmed",
  4: "shipping",
  5: "completed",
  6: "cancelled",
  7: "refundRequested",
  8: "refunded",
};

export function OrderStatusTimeline({ orderId }: Props) {
  const t = useTranslations("OrderStatus");
  const locale = useLocale();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get<{ data: HistoryItem[] }>(
          `/orders/${orderId}/history`,
          locale,
        );
        setHistory(res.data ?? []);
      } catch {
        // Silently fail, timeline is optional
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [orderId, locale]);

  if (loading) return null;
  if (history.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        {t("history")}
      </h2>
      <div className="space-y-3">
        {history.map((item, idx) => (
          <div key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              {idx < history.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-200 min-h-[16px]" />
              )}
            </div>
            <div className="flex-1 pb-3">
              <p className="text-sm font-medium">
                {t(STATUS_LABELS[item.to_status] ?? "unknown")}
              </p>
              {item.note && (
                <p className="text-xs text-gray-500">{item.note}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(item.created_at).toLocaleString(
                  locale === "jp" ? "ja-JP" : "vi-VN",
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

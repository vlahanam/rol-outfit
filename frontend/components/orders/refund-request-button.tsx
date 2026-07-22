"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  orderId: string;
  onSuccess: () => void;
}

export function RefundRequestButton({ orderId, onSuccess }: Props) {
  const t = useTranslations("OrderDetailPage");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!confirm(t("refundConfirm"))) return;
    setLoading(true);
    try {
      await api.post(`/orders/${orderId}/refund`, { reason }, locale);
      onSuccess();
    } catch {
      alert(t("refundFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (showReason) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("refundReasonPlaceholder")}
          className="w-full p-2 border rounded text-sm"
          rows={3}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-yellow-600 text-white py-2 rounded font-medium hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            {t("submitRefund")}
          </button>
          <button
            onClick={() => setShowReason(false)}
            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowReason(true)}
      className="w-full bg-yellow-100 text-yellow-700 py-3 rounded-lg font-semibold hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2"
    >
      <RotateCcw className="w-5 h-5" />
      {t("requestRefund")}
    </button>
  );
}

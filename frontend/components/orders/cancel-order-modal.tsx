"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  orderStatus: number;
  isLoading: boolean;
}

const ORDER_STATUS_PAYMENT_SUBMITTED = 2;
const ORDER_STATUS_CONFIRMED = 3;

export function CancelOrderModal({
  isOpen,
  onClose,
  onConfirm,
  orderStatus,
  isLoading,
}: CancelOrderModalProps) {
  const t = useTranslations("OrderDetailPage");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const requiresReason =
    orderStatus === ORDER_STATUS_PAYMENT_SUBMITTED ||
    orderStatus === ORDER_STATUS_CONFIRMED;

  const handleSubmit = async () => {
    if (requiresReason && !reason.trim()) {
      setError(t("reasonRequired"));
      return;
    }
    setError("");
    await onConfirm(reason);
  };

  const handleClose = () => {
    if (!isLoading) {
      setReason("");
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold mb-4">{t("cancelOrder")}</h3>

        {requiresReason ? (
          <>
            <p className="text-gray-600 mb-3">{t("cancelReasonPrompt")}</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("cancelReasonPlaceholder")}
              className="w-full border border-gray-300 rounded-lg p-3 min-h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </>
        ) : (
          <p className="text-gray-600 mb-4">{t("cancelConfirmMessage")}</p>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t("close")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("cancelling")}
              </>
            ) : (
              t("confirmCancel")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

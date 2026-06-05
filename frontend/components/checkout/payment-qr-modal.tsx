"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { X, Copy, Check, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  isOpen: boolean;
  orderId: string;
  orderCode: string;
  userName: string;
  totalPrice: number;
  onTransferred: () => void;
  onClose: () => void;
}

export function PaymentQRModal({
  isOpen,
  orderId,
  orderCode,
  userName,
  totalPrice,
  onTransferred,
  onClose,
}: Props) {
  const t = useTranslations("Payment");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const transferContent = `${userName} - ${orderCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transferContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = transferContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTransferred = async () => {
    setLoading(true);
    try {
      await api.put(`/orders/${orderId}/mark-transferred`);
      onTransferred();
    } catch (error) {
      console.error("Failed to mark as transferred:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">{t("title")}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            <Image
              src="/images/payment-qr-placeholder.png"
              alt="Payment QR"
              width={192}
              height={192}
              className="object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.innerHTML = `
                  <div class="flex flex-col items-center justify-center w-full h-full text-gray-400">
                    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="text-sm mt-2">QR Code</span>
                  </div>
                `;
              }}
            />
          </div>

          <p className="text-xl font-bold text-blue-600">
            {totalPrice.toLocaleString("vi-VN")}₫
          </p>

          <div className="w-full">
            <p className="text-sm text-gray-600 mb-2">{t("transferContent")}:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono truncate">
                {transferContent}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t("close")}
          </button>
          <button
            type="button"
            onClick={handleTransferred}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t("alreadyTransferred")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

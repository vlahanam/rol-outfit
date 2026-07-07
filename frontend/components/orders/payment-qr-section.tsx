"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Copy, Check, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";

interface Props {
  orderId: string;
  orderCode: string;
  userName: string;
  totalPrice: number;
  productType?: number;
  onTransferred?: () => void;
}

export function PaymentQRSection({
  orderId,
  orderCode,
  userName,
  totalPrice,
  productType,
  onTransferred,
}: Props) {
  const t = useTranslations("Payment");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const transferContent = `${userName} - ${orderCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transferContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
    if (!onTransferred) return;
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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold mb-4">{t("paymentInfo")}</h3>

      <div className="flex flex-col items-center gap-4">
        <div className="w-44 h-44 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <Image
            src="/images/payment-qr-placeholder.png"
            alt="Payment QR"
            width={176}
            height={176}
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
          {formatPrice(totalPrice, productType)}
        </p>

        <div className="w-full max-w-sm">
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

        {onTransferred && (
          <button
            type="button"
            onClick={handleTransferred}
            disabled={loading}
            className="w-full max-w-sm px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t("markAsTransferred")
            )}
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X, Copy, Check, Loader2, Upload } from "lucide-react";
import { ApiError, BASE, getToken } from "@/lib/api-client";
import { formatPrice, PRODUCT_TYPE_JAPANESE } from "@/lib/format";
import { adminSettings } from "@/lib/api-resources";

interface Props {
  isOpen: boolean;
  orderId: string;
  orderCode: string;
  userName: string;
  totalPrice: number;
  productType?: number;
  onTransferred: () => void;
  onClose: () => void;
}

export function PaymentQRModal({
  isOpen,
  orderId,
  orderCode,
  userName,
  totalPrice,
  productType,
  onTransferred,
  onClose,
}: Props) {
  const t = useTranslations("Payment");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nhatText, setNhatText] = useState("");
  const [nhatTextJa, setNhatTextJa] = useState("");
  const [vietUrl, setVietUrl] = useState("");
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setNhatText("");
    setNhatTextJa("");
    setVietUrl("");
    setImgError(false);
    adminSettings.getQR().then((res) => {
      setNhatText(res.data.nhat_text);
      setNhatTextJa(res.data.nhat_text_ja);
      setVietUrl(res.data.viet_url);
    }).catch(() => {});
  }, [isOpen, productType]);

  const displayNhatText = locale === "jp" && nhatTextJa ? nhatTextJa : nhatText;

  if (!isOpen) return null;

  const isJapanese = productType === PRODUCT_TYPE_JAPANESE;
  const defaultVietUrl = "/qr-viet.jpg";
  const displayVietUrl = vietUrl || defaultVietUrl;
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("file", file);

      const headers: Record<string, string> = { "Accept-Language": "vi" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${BASE}/orders/${orderId}/bill`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(
          res.status,
          body.reason ?? body.error ?? "Upload failed",
        );
      }

      onTransferred();
    } catch (error) {
      console.error("Failed to upload bill:", error);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const renderPaymentInfo = () => {
    if (isJapanese) {
      return (
        <div className="w-full space-y-4">
          {displayNhatText && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-2">{t("paymentInfo")}:</p>
              <p className="text-base font-semibold text-gray-900 whitespace-pre-wrap break-words">{displayNhatText}</p>
            </div>
          )}
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
      );
    }

    return (
      <>
        <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <img
            src={displayVietUrl}
            alt="Payment QR"
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        </div>
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
      </>
    );
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
          <p className="text-xl font-bold text-blue-600">
            {formatPrice(totalPrice, productType)}
          </p>

          {renderPaymentInfo()}
        </div>

        <div className="p-4 border-t flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t("close")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {t("uploadBill")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

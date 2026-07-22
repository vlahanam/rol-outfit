"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Copy, Check, Loader2, Upload } from "lucide-react";
import { ApiError, BASE, getToken } from "@/lib/api-client";
import { formatPrice, PRODUCT_TYPE_JAPANESE } from "@/lib/format";
import { adminSettings } from "@/lib/api-resources";

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
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nhatText, setNhatText] = useState("");
  const [nhatTextJa, setNhatTextJa] = useState("");
  const [vietUrl, setVietUrl] = useState("");
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNhatText("");
    setNhatTextJa("");
    setVietUrl("");
    setImgError(false);
    adminSettings.getQR().then((res) => {
      setNhatText(res.data.nhat_text);
      setNhatTextJa(res.data.nhat_text_ja);
      setVietUrl(res.data.viet_url);
    }).catch(() => {});
  }, [productType]);

  const displayNhatText = locale === "jp" && nhatTextJa ? nhatTextJa : nhatText;

  const transferContent = `${userName} - ${orderCode}`;
  const isJapanese = productType === PRODUCT_TYPE_JAPANESE;
  const defaultVietUrl = "/qr-viet.jpg";
  const displayVietUrl = vietUrl || defaultVietUrl;

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
    if (!file || !onTransferred) return;

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
        </div>
      );
    }

    return (
      <>
        <div className="w-44 h-44 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <img
            src={displayVietUrl}
            alt="Payment QR"
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        </div>
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
      </>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold mb-4">{t("paymentInfo")}</h3>

      <div className="flex flex-col items-center gap-4">
        <p className="text-xl font-bold text-blue-600">
          {formatPrice(totalPrice, productType)}
        </p>

        {renderPaymentInfo()}

        {onTransferred && (
          <>
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
              className="w-full max-w-sm px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </>
        )}
      </div>
    </div>
  );
}

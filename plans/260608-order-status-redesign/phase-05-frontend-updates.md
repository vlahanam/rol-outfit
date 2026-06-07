# Phase 5: Frontend Updates

## Overview
Update status badges, order detail page with history timeline and refund UI.

**Priority:** High | **Status:** pending | **Effort:** 2h

## Files to Modify

- `frontend/components/orders/order-status-badge.tsx`
- `frontend/app/[locale]/(main)/orders/[id]/page.tsx`
- `frontend/messages/vn.json`
- `frontend/messages/jp.json`
- `frontend/lib/api.ts` (if needed)

## Files to Create

- `frontend/components/orders/order-status-timeline.tsx`
- `frontend/components/orders/refund-request-button.tsx`

## Implementation

### Update Status Badge

```tsx
// order-status-badge.tsx
"use client";

import { useTranslations } from "next-intl";

interface Props {
  status: number;
}

// New status values matching backend
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
```

### Status Timeline Component

```tsx
// order-status-timeline.tsx
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
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get<{ data: HistoryItem[] }>(`/orders/${orderId}/history`, locale);
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
              {idx < history.length - 1 && <div className="w-0.5 h-full bg-gray-200" />}
            </div>
            <div className="flex-1 pb-3">
              <p className="text-sm font-medium">
                {t(STATUS_LABELS[item.to_status] ?? "unknown")}
              </p>
              {item.note && <p className="text-xs text-gray-500">{item.note}</p>}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(item.created_at).toLocaleString(locale === "jp" ? "ja-JP" : "vi-VN")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Refund Request Button

```tsx
// refund-request-button.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  orderId: string;
  onSuccess: () => void;
}

export function RefundRequestButton({ orderId, onSuccess }: Props) {
  const t = useTranslations("OrderDetailPage");
  const [loading, setLoading] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!confirm(t("refundConfirm"))) return;
    setLoading(true);
    try {
      await api.post(`/orders/${orderId}/refund`, { reason });
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
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
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
```

### Update Order Detail Page

Key changes to `orders/[id]/page.tsx`:

```tsx
// Update status constants
const ORDER_STATUS_AWAITING_PAYMENT = 1;
const ORDER_STATUS_PAYMENT_SUBMITTED = 2;
const ORDER_STATUS_CONFIRMED = 3;
const ORDER_STATUS_COMPLETED = 5;
const ORDER_STATUS_CANCELLED = 6;
const ORDER_STATUS_REFUND_REQUESTED = 7;
const ORDER_STATUS_REFUNDED = 8;

// Import new components
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import { RefundRequestButton } from "@/components/orders/refund-request-button";

// In render, add timeline:
<OrderStatusTimeline orderId={order.id} />

// Show refund button for COMPLETED orders:
{order.status === ORDER_STATUS_COMPLETED && (
  <RefundRequestButton orderId={order.id} onSuccess={() => router.refresh()} />
)}

// Show refund pending message:
{order.status === ORDER_STATUS_REFUND_REQUESTED && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <p className="text-yellow-700 text-center text-sm">{t("refundPending")}</p>
  </div>
)}

// Update cancel button condition (allow up to CONFIRMED):
{(order.status <= ORDER_STATUS_CONFIRMED && order.status !== ORDER_STATUS_CANCELLED) && (
  <button onClick={handleCancel} ...>
```

### Update i18n Messages

#### vn.json

```json
{
  "OrderStatus": {
    "awaitingPayment": "Chờ chuyển khoản",
    "paymentSubmitted": "Đã báo chuyển khoản",
    "confirmed": "Xác nhận thành công",
    "shipping": "Đang giao hàng",
    "completed": "Hoàn thành",
    "cancelled": "Đã hủy",
    "refundRequested": "Yêu cầu hoàn tiền",
    "refunded": "Đã hoàn tiền",
    "history": "Lịch sử đơn hàng"
  },
  "OrderDetailPage": {
    "requestRefund": "Yêu cầu hoàn tiền",
    "refundConfirm": "Bạn có chắc muốn yêu cầu hoàn tiền?",
    "refundFailed": "Không thể gửi yêu cầu hoàn tiền",
    "refundPending": "Đang chờ xử lý hoàn tiền",
    "refundReasonPlaceholder": "Lý do yêu cầu hoàn tiền (không bắt buộc)",
    "submitRefund": "Gửi yêu cầu",
    "cancel": "Hủy"
  }
}
```

#### jp.json

```json
{
  "OrderStatus": {
    "awaitingPayment": "入金待ち",
    "paymentSubmitted": "入金報告済み",
    "confirmed": "確認完了",
    "shipping": "配送中",
    "completed": "完了",
    "cancelled": "キャンセル済み",
    "refundRequested": "返金申請中",
    "refunded": "返金済み",
    "history": "注文履歴"
  },
  "OrderDetailPage": {
    "requestRefund": "返金を申請",
    "refundConfirm": "返金を申請してもよろしいですか？",
    "refundFailed": "返金申請に失敗しました",
    "refundPending": "返金処理中",
    "refundReasonPlaceholder": "返金理由（任意）",
    "submitRefund": "申請する",
    "cancel": "キャンセル"
  }
}
```

## Todo

- [ ] Update order-status-badge.tsx with new values
- [ ] Create order-status-timeline.tsx
- [ ] Create refund-request-button.tsx
- [ ] Update orders/[id]/page.tsx
- [ ] Update vn.json messages
- [ ] Update jp.json messages
- [ ] Test all status displays
- [ ] Test refund request flow
- [ ] Test cancel button visibility

## Success Criteria

- Status badges show correct Vietnamese/Japanese labels
- Timeline shows order history
- Refund button appears only for COMPLETED orders
- Cancel button appears only for cancellable statuses
- All i18n strings working in both languages

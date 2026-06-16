# Phase 3: Frontend - Cancel Order Modal

## Overview

Create cancel modal with conditional reason textarea based on order status.

## Files to Create

### 1. `frontend/components/orders/cancel-order-modal.tsx`

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  orderStatus: number;
  isLoading: boolean;
}

export function CancelOrderModal({
  isOpen,
  onClose,
  onConfirm,
  orderStatus,
  isLoading,
}: CancelOrderModalProps) {
  const t = useTranslations("Orders");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const requiresReason = orderStatus === 2 || orderStatus === 3;

  const handleSubmit = async () => {
    if (requiresReason && !reason.trim()) {
      setError(t("reasonRequired"));
      return;
    }
    setError("");
    await onConfirm(reason);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">{t("cancelOrder")}</h3>
        
        {requiresReason ? (
          <>
            <p className="text-gray-600 mb-3">{t("cancelReasonPrompt")}</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("cancelReasonPlaceholder")}
              className="w-full border rounded-lg p-3 min-h-24"
              disabled={isLoading}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </>
        ) : (
          <p className="text-gray-600 mb-4">{t("cancelConfirmMessage")}</p>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            {t("close")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? t("cancelling") : t("confirmCancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Files to Modify

### 2. `frontend/app/[locale]/(main)/orders/[id]/page.tsx`

Replace confirm() with modal:
```tsx
import { CancelOrderModal } from "@/components/orders/cancel-order-modal";

// Add state
const [showCancelModal, setShowCancelModal] = useState(false);

// Update handleCancel
const handleCancel = async (reason: string) => {
  setCancelling(true);
  try {
    await api.delete(`/orders/${order.id}`, { data: { reason } });
    router.refresh();
    setShowCancelModal(false);
  } catch {
    alert(t("cancelFailed"));
  } finally {
    setCancelling(false);
  }
};

// Replace button onClick
<button onClick={() => setShowCancelModal(true)}>
  {t("cancelOrder")}
</button>

// Add modal
<CancelOrderModal
  isOpen={showCancelModal}
  onClose={() => setShowCancelModal(false)}
  onConfirm={handleCancel}
  orderStatus={order.status}
  isLoading={cancelling}
/>
```

### 3. Translations

**`frontend/messages/vi.json`:**
```json
{
  "Orders": {
    "cancelReasonPrompt": "Vui lòng nhập lý do hủy đơn hàng:",
    "cancelReasonPlaceholder": "Nhập lý do...",
    "reasonRequired": "Vui lòng nhập lý do hủy đơn",
    "cancelConfirmMessage": "Bạn có chắc muốn hủy đơn hàng này?",
    "confirmCancel": "Xác nhận hủy",
    "cancelling": "Đang hủy..."
  }
}
```

**`frontend/messages/en.json`:**
```json
{
  "Orders": {
    "cancelReasonPrompt": "Please provide a reason for cancellation:",
    "cancelReasonPlaceholder": "Enter reason...",
    "reasonRequired": "Please provide a cancellation reason",
    "cancelConfirmMessage": "Are you sure you want to cancel this order?",
    "confirmCancel": "Confirm Cancel",
    "cancelling": "Cancelling..."
  }
}
```

## Todo

- [ ] Create CancelOrderModal component
- [ ] Update orders/[id]/page.tsx to use modal
- [ ] Add VI translations
- [ ] Add EN translations
- [ ] Test: status 1 cancel flow
- [ ] Test: status 2,3 cancel with reason validation

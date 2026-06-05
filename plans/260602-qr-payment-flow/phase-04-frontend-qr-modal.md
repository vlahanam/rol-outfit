# Phase 4: Frontend QR Modal

**Status:** pending | **Effort:** 1h | **Priority:** high

## Overview

Create QR payment modal that shows after order placement on checkout page.

## Files to Create

- `frontend/components/checkout/payment-qr-modal.tsx` - Modal component

## Files to Modify

- `frontend/app/[locale]/(main)/checkout/page.tsx` - Integrate modal
- `frontend/public/images/payment-qr.png` - Add placeholder QR image

## Component Design

### PaymentQRModal Props

```typescript
interface PaymentQRModalProps {
  isOpen: boolean;
  orderId: string;
  orderCode: string;
  userName: string;
  totalPrice: number;
  onTransferred: () => void;  // Call API then close
  onClose: () => void;        // Just close
}
```

### Modal Content

```
┌─────────────────────────────────────┐
│         Thanh toán đơn hàng         │
├─────────────────────────────────────┤
│                                     │
│           ┌─────────┐               │
│           │   QR    │               │
│           │  CODE   │               │
│           └─────────┘               │
│                                     │
│  Số tiền: 1,250,000 VND             │
│                                     │
│  Nội dung chuyển khoản:             │
│  ┌─────────────────────────────┐    │
│  │ Nguyen Van A - ROL-260602-  │    │
│  └─────────────────────────────┘    │
│           [Copy]                    │
│                                     │
├─────────────────────────────────────┤
│  [Đã chuyển khoản]    [Đóng]        │
└─────────────────────────────────────┘
```

## Implementation Steps

### 1. Add Placeholder QR Image

Download/create a placeholder QR image at `frontend/public/images/payment-qr.png`

### 2. Create PaymentQRModal Component

```typescript
"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

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
  const t = useTranslations("Checkout");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const transferContent = `${userName} - ${orderCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(transferContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransferred = async () => {
    setLoading(true);
    try {
      await fetch(`/api/v1/orders/${orderId}/mark-transferred`, {
        method: "PUT",
        credentials: "include",
      });
      onTransferred();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("paymentTitle")}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          <Image
            src="/images/payment-qr.png"
            alt="Payment QR"
            width={200}
            height={200}
          />
          
          <p className="text-lg font-semibold">
            {new Intl.NumberFormat("vi-VN").format(totalPrice)} VND
          </p>
          
          <div className="w-full">
            <p className="text-sm text-muted-foreground mb-2">
              {t("transferContent")}:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-sm">
                {transferContent}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          <Button onClick={handleTransferred} disabled={loading}>
            {t("alreadyTransferred")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Integrate in Checkout Page

After successful order creation, show modal instead of immediate redirect:

```typescript
// In checkout page
const [showQRModal, setShowQRModal] = useState(false);
const [createdOrder, setCreatedOrder] = useState<{id: string, orderCode: string} | null>(null);

const handleSubmitOrder = async () => {
  // ... existing order creation logic
  const result = await createOrder(data);
  
  // Instead of redirect, show modal
  setCreatedOrder({ id: result.id, orderCode: result.order_code });
  setShowQRModal(true);
};

const handleTransferred = () => {
  setShowQRModal(false);
  router.push(`/checkout/success?orderId=${createdOrder.id}`);
};

const handleCloseModal = () => {
  setShowQRModal(false);
  router.push(`/checkout/success?orderId=${createdOrder.id}`);
};
```

## Todo

- [ ] Add placeholder QR image
- [ ] Create PaymentQRModal component
- [ ] Add i18n keys for modal text
- [ ] Integrate modal in checkout page
- [ ] Test modal open/close flow
- [ ] Test mark-transferred API call

## Success Criteria

- Modal shows after order creation
- Transfer content displays correctly: "{name} - {order_code}"
- Copy button works
- "Đã chuyển khoản" calls API and redirects
- "Đóng" redirects without API call

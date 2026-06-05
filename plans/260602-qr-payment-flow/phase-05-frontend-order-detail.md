# Phase 5: Frontend Order Detail

**Status:** pending | **Effort:** 1h | **Priority:** high

## Overview

Show QR payment section in order detail for AWAITING_PAYMENT orders. Add admin verify button for PAYMENT_SUBMITTED orders.

## Files to Modify

- `frontend/app/[locale]/(main)/orders/[id]/page.tsx` - User order detail
- `frontend/app/admin/(protected)/orders/[id]/page.tsx` - Admin order detail

## Files to Create

- `frontend/components/orders/payment-qr-section.tsx` - Reusable QR section

## Implementation Steps

### 1. Create PaymentQRSection Component

Shared component for showing QR in order detail:

```typescript
"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";

interface Props {
  orderId: string;
  orderCode: string;
  userName: string;
  totalPrice: number;
  onTransferred?: () => void;  // Optional - hide button if not provided
}

export function PaymentQRSection({
  orderId,
  orderCode,
  userName,
  totalPrice,
  onTransferred,
}: Props) {
  const t = useTranslations("Order");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const transferContent = `${userName} - ${orderCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(transferContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransferred = async () => {
    if (!onTransferred) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/mark-transferred`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) onTransferred();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("paymentInfo")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Image
          src="/images/payment-qr.png"
          alt="Payment QR"
          width={180}
          height={180}
        />
        
        <p className="text-lg font-semibold">
          {new Intl.NumberFormat("vi-VN").format(totalPrice)} VND
        </p>
        
        <div className="w-full max-w-sm">
          <p className="text-sm text-muted-foreground mb-2">
            {t("transferContent")}:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-muted rounded text-sm truncate">
              {transferContent}
            </code>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {onTransferred && (
          <Button onClick={handleTransferred} disabled={loading} className="w-full max-w-sm">
            {t("markAsTransferred")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

### 2. Update User Order Detail Page

Add QR section for AWAITING_PAYMENT status:

```typescript
// In order detail page
const ORDER_STATUS_AWAITING_PAYMENT = 7;
const ORDER_STATUS_PAYMENT_SUBMITTED = 8;

// In render:
{order.status === ORDER_STATUS_AWAITING_PAYMENT && (
  <PaymentQRSection
    orderId={order.id}
    orderCode={order.order_code}
    userName={user.name}
    totalPrice={order.total_price}
    onTransferred={() => router.refresh()}
  />
)}

{order.status === ORDER_STATUS_PAYMENT_SUBMITTED && (
  <Card>
    <CardContent className="py-6 text-center">
      <p className="text-muted-foreground">
        {t("waitingForVerification")}
      </p>
    </CardContent>
  </Card>
)}
```

### 3. Update Admin Order Detail Page

Add verify button for PAYMENT_SUBMITTED:

```typescript
// In admin order detail
{order.status === ORDER_STATUS_PAYMENT_SUBMITTED && (
  <Button 
    onClick={() => handleUpdateStatus(ORDER_STATUS_CONFIRMED)}
    className="w-full"
  >
    {t("verifyPayment")}
  </Button>
)}
```

## Todo

- [ ] Create PaymentQRSection component
- [ ] Add QR section to user order detail (status 7)
- [ ] Add "waiting for verification" message (status 8)
- [ ] Add verify button to admin order detail (status 8)
- [ ] Add i18n keys
- [ ] Test user flow: view QR → mark transferred
- [ ] Test admin flow: verify payment

## Success Criteria

- AWAITING_PAYMENT orders show QR + transfer button
- PAYMENT_SUBMITTED orders show waiting message
- Admin sees verify button for PAYMENT_SUBMITTED
- Page refreshes after status change

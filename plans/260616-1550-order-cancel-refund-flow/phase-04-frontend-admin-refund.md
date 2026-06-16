# Phase 4: Frontend - Admin Refund Button

## Overview

Add refund button for cancelled orders in admin order detail page.

## Files to Modify

### 1. `frontend/app/admin/(protected)/orders/[id]/page.tsx`

Add refund handler and button:
```tsx
const [refunding, setRefunding] = useState(false);

const handleRefundCancelled = async () => {
  if (!confirm("Xác nhận hoàn tiền cho đơn hàng đã hủy?")) return;
  
  setRefunding(true);
  try {
    await api.put(`/admin/orders/${order.id}/refund-cancelled`);
    toast.success("Đã hoàn tiền thành công");
    router.refresh();
  } catch (err) {
    toast.error("Hoàn tiền thất bại");
  } finally {
    setRefunding(false);
  }
};

// In render, add button for cancelled orders (status 6)
{order.status === 6 && (
  <button
    onClick={handleRefundCancelled}
    disabled={refunding}
    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
  >
    {refunding ? "Đang xử lý..." : "Hoàn tiền"}
  </button>
)}
```

### 2. Update Status Badge (Optional Enhancement)

In admin page, show refund eligibility indicator for cancelled orders:
```tsx
{order.status === 6 && (
  <span className="ml-2 text-xs text-yellow-600">
    (Có thể hoàn tiền)
  </span>
)}
```

## Todo

- [ ] Add refunding state
- [ ] Add handleRefundCancelled handler
- [ ] Add refund button for status 6
- [ ] Add loading state
- [ ] Test: admin refund cancelled order → success
- [ ] Test: confirm dialog works
- [ ] Verify order history records refund

# Phase 2: Admin Frontend Fixes

## Overview

- **Priority:** High
- **Status:** Complete
- **Effort:** 1h

Fix admin order management bugs: status dropdown, error handling, refund UI.

## Files to Modify

| File | Action |
|------|--------|
| `frontend/app/admin/(protected)/orders/[id]/page.tsx` | Major refactor |
| `frontend/app/admin/(protected)/orders/page.tsx` | Add error handling |

## Current Issues

1. **Status dropdown (lines 155-164):** Shows all 8 statuses regardless of valid transitions
2. **Error handling (lines 89, 103):** Uses `alert()` instead of error state
3. **Missing refund UI:** No buttons for REFUND_REQUESTED (status 7)
4. **List page (line 43-44):** Silent failure on API error

## Implementation Steps

### Step 1: Add ValidTransitions Map

**File:** `frontend/app/admin/(protected)/orders/[id]/page.tsx`

Add after STATUS_OPTIONS:
```tsx
const VALID_TRANSITIONS: Record<number, number[]> = {
  1: [2, 6],      // AWAITING_PAYMENT → PAYMENT_SUBMITTED, CANCELLED
  2: [3, 1, 6],   // PAYMENT_SUBMITTED → CONFIRMED, AWAITING_PAYMENT, CANCELLED
  3: [4, 6],      // CONFIRMED → SHIPPING, CANCELLED
  4: [5, 6],      // SHIPPING → COMPLETED, CANCELLED
  5: [7],         // COMPLETED → REFUND_REQUESTED
  6: [8],         // CANCELLED → REFUNDED
  7: [8, 5],      // REFUND_REQUESTED → REFUNDED, COMPLETED (reject)
  8: [],          // REFUNDED → terminal
};

const getValidStatusOptions = (currentStatus: number) => {
  const validIds = VALID_TRANSITIONS[currentStatus] || [];
  return STATUS_OPTIONS.filter(s => validIds.includes(s.value));
};
```

### Step 2: Replace Alert with Error State

**File:** `frontend/app/admin/(protected)/orders/[id]/page.tsx`

Add state:
```tsx
const [statusError, setStatusError] = useState<string | null>(null);
```

Update handleStatusChange:
```tsx
const handleStatusChange = async (newStatus: number) => {
  if (!order) return;
  setUpdating(true);
  setStatusError(null);
  try {
    const res = await api.put<ApiResponse<Order>>(`/admin/orders/${id}/status`, {
      status: newStatus,
    });
    setOrder(res.data);
  } catch (err: any) {
    setStatusError(err?.message || 'Không thể cập nhật trạng thái');
  } finally {
    setUpdating(false);
  }
};
```

Update handleRefundCancelled:
```tsx
const handleRefundCancelled = async () => {
  if (!order || !confirm('Xác nhận hoàn tiền cho đơn hàng đã hủy?')) return;
  setRefunding(true);
  setStatusError(null);
  try {
    await api.put(`/admin/orders/${id}/refund-cancelled`);
    const res = await api.get<ApiResponse<Order>>(`/admin/orders/${id}`);
    setOrder(res.data);
  } catch (err: any) {
    setStatusError(err?.message || 'Hoàn tiền thất bại');
  } finally {
    setRefunding(false);
  }
};
```

### Step 3: Filter Status Dropdown

Replace lines 155-164:
```tsx
<select
  value={order.status}
  onChange={(e) => handleStatusChange(Number(e.target.value))}
  disabled={updating || getValidStatusOptions(order.status).length === 0}
  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
>
  <option value={order.status} disabled>
    {STATUS_OPTIONS.find(s => s.value === order.status)?.label}
  </option>
  {getValidStatusOptions(order.status).map((s) => (
    <option key={s.value} value={s.value}>{s.label}</option>
  ))}
</select>
```

### Step 4: Add Error Display

Add after the status dropdown:
```tsx
{statusError && (
  <div className="text-red-600 text-sm mt-2">{statusError}</div>
)}
```

### Step 5: Add Refund Request UI (Status 7)

Add constants:
```tsx
const ORDER_STATUS_REFUND_REQUESTED = 7;
const ORDER_STATUS_REFUNDED = 8;
const ORDER_STATUS_COMPLETED = 5;
```

Add handler:
```tsx
const handleRefundAction = async (approve: boolean) => {
  if (!order) return;
  const endpoint = approve 
    ? `/admin/orders/${id}/refund/approve`
    : `/admin/orders/${id}/refund/reject`;
  
  setRefunding(true);
  setStatusError(null);
  try {
    await api.put(endpoint, approve ? {} : { reason: 'Từ chối bởi admin' });
    const res = await api.get<ApiResponse<Order>>(`/admin/orders/${id}`);
    setOrder(res.data);
  } catch (err: any) {
    setStatusError(err?.message || 'Thao tác thất bại');
  } finally {
    setRefunding(false);
  }
};
```

Add UI after CANCELLED refund button (line 267):
```tsx
{order.status === ORDER_STATUS_REFUND_REQUESTED && (
  <div className="mt-4 space-y-2">
    <p className="text-sm text-orange-700 font-medium">Khách yêu cầu hoàn tiền</p>
    <div className="flex gap-2">
      <button
        onClick={() => handleRefundAction(true)}
        disabled={refunding}
        className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {refunding ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Xác nhận hoàn tiền'}
      </button>
      <button
        onClick={() => handleRefundAction(false)}
        disabled={refunding}
        className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        Từ chối
      </button>
    </div>
  </div>
)}
```

### Step 6: Fix List Page Error Handling

**File:** `frontend/app/admin/(protected)/orders/page.tsx`

Add state:
```tsx
const [error, setError] = useState<string | null>(null);
```

Update fetch:
```tsx
useEffect(() => {
  const fetchOrders = async () => {
    try {
      setError(null);
      const res = await api.get<ApiResponse<Order[]>>('/admin/orders?limit=100');
      setOrders(res.data ?? []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách đơn hàng');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
  fetchOrders();
}, []);
```

Add retry handler:
```tsx
const handleRetry = () => {
  setLoading(true);
  setError(null);
  // Re-trigger useEffect by using a refresh key or moving fetch to function
};
```

Update render (after loading check):
```tsx
{error && (
  <div className="p-8 text-center">
    <p className="text-red-600 mb-4">{error}</p>
    <button
      onClick={() => window.location.reload()}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Thử lại
    </button>
  </div>
)}
```

## Todo List

- [x] Add VALID_TRANSITIONS map
- [x] Add getValidStatusOptions helper
- [x] Add statusError state
- [x] Update handleStatusChange error handling
- [x] Update handleRefundCancelled error handling
- [x] Filter status dropdown to valid options
- [x] Add error display below dropdown
- [x] Add handleRefundAction for status 7
- [x] Add approve/reject refund buttons UI
- [x] Add error state to list page
- [x] Add error display with retry button
- [x] Verify TypeScript compiles

## Success Criteria

- Status dropdown only shows valid transition options
- No browser alert() calls
- Error messages display in UI
- Admin can approve/reject refund requests (status 7)
- List page shows error on fetch failure

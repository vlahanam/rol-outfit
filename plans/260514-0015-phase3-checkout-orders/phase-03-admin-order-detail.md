# Phase 3: Admin Order Detail

**Priority:** P1
**Effort:** 1.5h
**Status:** completed

## Overview

Replace mock data in admin order detail page with real API calls and implement status update functionality.

## Context Links
- Current file: `frontend/app/admin/(protected)/orders/[id]/page.tsx` (mock data)
- Admin orders list: `frontend/app/admin/(protected)/orders/page.tsx` (real API pattern)
- API client: `frontend/lib/api.ts`

## Current State

The admin order detail page uses hardcoded mock data:
```tsx
const mockOrder = {
  id: 1,
  status: 'Đang giao',
  // ... static data
};
```

Status dropdown exists but doesn't call API.

## Requirements

### Functional
- Fetch real order data from `GET /admin/orders/:id`
- Display order items, customer, shipping, payment info
- Update status via `PUT /admin/orders/:id/status`
- Show loading/error states

### Non-functional
- Maintain existing UI layout
- Add toast notifications for actions

## API Endpoints

```ts
// Get order detail
GET /api/v1/admin/orders/:id
Response: { data: Order }

// Update status
PUT /api/v1/admin/orders/:id/status
Body: { status: number }
Response: { data: Order }
```

## Implementation Steps

### 1. Add API Fetch

Replace mock data with API call:

```tsx
const [order, setOrder] = useState<Order | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchOrder = async () => {
    try {
      const res = await api.get<ApiResponse<Order>>(`/admin/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };
  fetchOrder();
}, [id]);
```

### 2. Implement Status Update

Add API call when status dropdown changes:

```tsx
const [updating, setUpdating] = useState(false);

const handleStatusChange = async (newStatus: number) => {
  if (!order) return;
  setUpdating(true);
  try {
    const res = await api.put<ApiResponse<Order>>(`/admin/orders/${id}/status`, {
      status: newStatus
    });
    setOrder(res.data);
    toast.success('Đã cập nhật trạng thái');
  } catch (err) {
    toast.error('Không thể cập nhật trạng thái');
  } finally {
    setUpdating(false);
  }
};
```

### 3. Update Status Dropdown

Change from string labels to numeric codes:

```tsx
const STATUS_OPTIONS = [
  { value: 1, label: 'Chờ xử lý' },
  { value: 2, label: 'Đã xác nhận' },
  { value: 3, label: 'Đang giao' },
  { value: 4, label: 'Đã giao' },
  { value: 5, label: 'Đã thanh toán' },
  { value: 6, label: 'Đã hủy' },
];

<select
  value={order.status}
  onChange={(e) => handleStatusChange(Number(e.target.value))}
  disabled={updating}
  className="..."
>
  {STATUS_OPTIONS.map((opt) => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</select>
```

### 4. Handle Loading/Error States

```tsx
if (loading) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-gray-500">Đang tải...</p>
    </div>
  );
}

if (error || !order) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <p className="text-red-600">{error || 'Không tìm thấy đơn hàng'}</p>
      <Link href="/admin/orders" className="text-blue-600 hover:underline">
        Quay lại danh sách
      </Link>
    </div>
  );
}
```

### 5. Display Real Order Items

The order from API includes `items` array:

```tsx
{order.items?.map((item) => (
  <tr key={item.id}>
    <td>{item.product_name || `Product ${item.product_id}`}</td>
    <td>{item.variant_attributes ? JSON.stringify(item.variant_attributes) : '-'}</td>
    <td>{item.price.toLocaleString('vi-VN')}₫</td>
    <td>{item.quantity}</td>
    <td>{(item.price * item.quantity).toLocaleString('vi-VN')}₫</td>
  </tr>
))}
```

**Note:** May need to fetch product names separately if not included in order items.

## Todo List

- [x] Replace mock data with `GET /admin/orders/:id`
- [x] Implement status update with `PUT /admin/orders/:id/status`
- [x] Add loading state
- [x] Add error state with back link
- [x] Add toast notifications
- [x] Update status dropdown to use numeric values
- [x] Display real order items
- [x] Test status update flow

## Success Criteria

- [x] Page loads real order data from API
- [x] Status dropdown updates via API
- [x] Toast shows on successful update
- [x] Error handling for failed requests
- [x] Loading state while fetching

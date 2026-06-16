# Brainstorm: Order Cancel & Refund Flow

**Date:** 2026-06-16
**Status:** Approved

## Problem Statement

Cần điều chỉnh flow hủy đơn và hoàn tiền để:
1. Bắt buộc nhập lý do khi hủy đơn đã báo/xác nhận CK
2. Admin có thể hoàn tiền cho đơn đã hủy (ngoài flow hoàn tiền cũ)

## Current State

- Order statuses: 1-8 (AWAITING → PAYMENT_SUBMITTED → CONFIRMED → SHIPPING → COMPLETED → CANCELLED → REFUND_REQUESTED → REFUNDED)
- Cancel: Cho phép status 1,2,3 → 6, không cần lý do
- Refund: Chỉ từ COMPLETED (5) → REFUND_REQUESTED (7) → REFUNDED (8)

## Requirements

### Cancel Flow
| From Status | Lý do | Action |
|-------------|-------|--------|
| 1 (Chờ CK) | Không bắt buộc | Confirm dialog |
| 2 (Đã báo CK) | **Bắt buộc** | Modal + textarea |
| 3 (Xác nhận CK) | **Bắt buộc** | Modal + textarea |

### Refund Flow
1. **Giữ flow cũ:** COMPLETED (5) → REFUND_REQUESTED (7) → Admin approve → REFUNDED (8)
2. **Thêm flow mới:** CANCELLED (6) → Admin action "Hoàn tiền" → REFUNDED (8)

## Design

### Order Status Flow Diagram
```
[1] Chờ CK → [2] Đã báo CK → [3] Xác nhận CK → [4] Đang giao → [5] Hoàn thành
    ↓              ↓               ↓                                   ↓
   [6] Đã hủy ←────┴───────────────┘                           [7] YC hoàn tiền
    ↓                                                                   ↓
   [8] Đã hoàn tiền ←──────────────────────────────────────────────────┘
```

### Changes Required

**Backend:**
1. `models/order.go`: Add transition 6 → 8
2. `controllers/order_controller.go`: Accept `reason` in cancel request
3. `services/order_service.go`: Validate reason required for status 2,3
4. `controllers/admin_order_controller.go`: Add `RefundCancelledOrder` endpoint

**Frontend:**
1. `app/[locale]/(main)/orders/[id]/page.tsx`: Cancel modal với textarea
2. `components/orders/cancel-order-modal.tsx`: New component
3. `app/admin/(protected)/orders/[id]/page.tsx`: Add refund button for cancelled orders

### API Changes

**Modify:** `DELETE /api/v1/orders/:id`
```json
// Request body (optional for status 1, required for 2,3)
{ "reason": "Lý do hủy đơn" }
```

**Add:** `PUT /api/v1/admin/orders/:id/refund-cancelled`
```json
// Response
{ "message": "Order refunded successfully" }
```

## Success Criteria

- [ ] User có thể hủy đơn status 1 mà không cần lý do
- [ ] User phải nhập lý do khi hủy đơn status 2,3
- [ ] Admin có thể hoàn tiền cho đơn đã hủy
- [ ] Order history ghi nhận lý do hủy và hoàn tiền
- [ ] Translations cho VI/EN

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking change cho API cancel | Body optional cho backward compat |
| Admin refund sai đơn | Confirm dialog + audit log |

## Next Steps

→ Create implementation plan with /ck:plan

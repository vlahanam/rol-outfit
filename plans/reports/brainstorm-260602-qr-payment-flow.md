# Brainstorm: QR Bank Transfer Payment Flow

**Date:** 2026-06-02  
**Status:** Approved → Ready for planning

## Problem Statement

Thay đổi luồng thanh toán để hiển thị mã QR sau khi đặt hàng, yêu cầu user chuyển khoản với nội dung "Họ tên - Mã đơn hàng".

## Requirements

- Hiện QR modal ngay trên checkout sau khi đặt hàng
- 2 buttons: "Đã chuyển khoản" / "Đóng"
- "Đã chuyển khoản" → status PAYMENT_SUBMITTED (chờ admin verify)
- "Đóng" → status AWAITING_PAYMENT (có thể quay lại CK sau)
- User xem lại QR từ order detail nếu cần
- Admin verify thủ công trong order detail
- Cho phép hủy đơn khi chờ chuyển khoản

## Approved Design

### New Order Statuses
- `AWAITING_PAYMENT (7)`: Chờ chuyển khoản
- `PAYMENT_SUBMITTED (8)`: Đã báo CK, chờ verify

### Backend Changes
1. Add 2 status constants to `order.go`
2. `CreateFromCart`: Set status = AWAITING_PAYMENT
3. `CancelOrder`: Allow cancel when AWAITING_PAYMENT
4. New endpoint: `PUT /orders/:id/mark-transferred`

### Frontend Changes
1. Checkout: QR modal after order creation
2. Order detail (user): Show QR + button for AWAITING_PAYMENT
3. Admin order detail: "Xác nhận thanh toán" button for PAYMENT_SUBMITTED
4. Status badge: New colors/labels for 2 statuses

### QR Image
Static placeholder `/public/images/payment-qr.png` (fake for now)

## Risk Assessment
- User fake CK → mitigated by admin manual verify
- Đơn treo lâu → admin can cancel or remind
- Race condition → endpoint only accepts AWAITING_PAYMENT status

## Next Steps
Create implementation plan via /ck:plan

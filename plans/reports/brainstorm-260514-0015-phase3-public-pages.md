# Brainstorm Report: Phase 3 Public Pages

**Date:** 2026-05-14
**Status:** Ready for Planning
**Priority:** High

---

## Problem Statement

Dự án rol-outfit đã hoàn thành backend API và admin dashboard, nhưng thiếu các trang public cho user thực hiện flow mua hàng: đăng nhập → xem sản phẩm → thêm giỏ hàng → checkout → theo dõi đơn hàng.

## Current State

| Component | Backend | Frontend |
|-----------|---------|----------|
| Auth (Login/Register) | ✅ Complete | ❌ Missing |
| Cart Management | ✅ Complete | ⚠️ Context only |
| Checkout/Order | ✅ Complete | ❌ Missing |
| Order History | ✅ Complete | ❌ Missing |
| Admin Orders | ✅ Complete | ❌ Missing |

## Scope

### In Scope
1. **Authentication UI** - Login, Register, Logout pages
2. **Cart UI** - Full cart page with quantity controls
3. **Checkout Flow** - Shipping form → Order confirmation
4. **Order Pages** - History list, Detail view, Cancel action
5. **Admin Orders** - List, Detail, Status update

### Out of Scope (Phase 4)
- Payment gateway integration
- Email notifications
- Product reviews
- Wishlist

---

## Implementation Approach

### Recommended: Sequential with Shared Components

```
Week 1: Auth UI
├── Login page với form validation (Zod)
├── Register page với password confirmation
├── Auth context updates (user state)
└── Protected route middleware updates

Week 2: Cart + Checkout
├── Cart page (/cart) với quantity controls
├── Add-to-cart button trên product pages
├── Checkout page với shipping form
└── Order confirmation page

Week 3: Order Management
├── Order history page (/orders)
├── Order detail page (/orders/[id])
├── Cancel order functionality
├── Admin orders list + status update
```

### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Form validation | Zod + React Hook Form | Đã dùng trong admin, consistency |
| State management | React Context | Cart context đã có, mở rộng cho auth |
| Styling | TailwindCSS | Đã setup, consistent với admin |
| Notifications | Sonner | Đã integrate, toast cho success/error |
| i18n | next-intl | Đã setup cho vn/jp |

---

## Detailed Tasks

### 1. Authentication UI

**Files to create:**
- `frontend/src/app/[locale]/(auth)/login/page.tsx`
- `frontend/src/app/[locale]/(auth)/register/page.tsx`
- `frontend/src/app/[locale]/(auth)/layout.tsx`
- `frontend/src/context/auth-context.tsx`

**Backend APIs (existing):**
- `POST /api/v1/auth/login` - Returns access + refresh tokens
- `POST /api/v1/auth/register` - Creates user, returns tokens
- `POST /api/v1/auth/logout` - Revokes refresh tokens
- `POST /api/v1/auth/refresh` - Token rotation (auto in api-client)

**Key Features:**
- Form validation với error messages
- Remember me option (localStorage vs sessionStorage)
- Redirect after login (return URL)
- Cross-tab logout sync (BroadcastChannel - đã có trong auth.ts)

### 2. Cart + Checkout

**Files to create:**
- `frontend/src/app/[locale]/(main)/cart/page.tsx` - Cart page
- `frontend/src/app/[locale]/(main)/checkout/page.tsx` - Checkout form
- `frontend/src/app/[locale]/(main)/checkout/success/page.tsx` - Confirmation
- `frontend/src/components/cart/CartItem.tsx`
- `frontend/src/components/cart/CartSummary.tsx`
- `frontend/src/components/checkout/ShippingForm.tsx`

**Backend APIs (existing):**
- `GET /api/v1/cart` - Get user's cart
- `POST /api/v1/cart/items` - Add item
- `PUT /api/v1/cart/items/:id` - Update quantity
- `DELETE /api/v1/cart/items/:id` - Remove item
- `POST /api/v1/orders` - Create order from cart

**Key Features:**
- Quantity +/- buttons với debounce
- Remove item với confirmation
- Cart summary (subtotal, shipping, total)
- Shipping address form với validation
- Order review before confirm

### 3. Order Management

**Files to create:**
- `frontend/src/app/[locale]/(main)/orders/page.tsx` - Order list
- `frontend/src/app/[locale]/(main)/orders/[id]/page.tsx` - Order detail
- `frontend/src/app/admin/(protected)/orders/page.tsx` - Admin list
- `frontend/src/app/admin/(protected)/orders/[id]/page.tsx` - Admin detail
- `frontend/src/components/orders/OrderCard.tsx`
- `frontend/src/components/orders/OrderStatusBadge.tsx`

**Backend APIs (existing):**
- `GET /api/v1/orders` - User's orders
- `GET /api/v1/orders/:id` - Order detail
- `DELETE /api/v1/orders/:id` - Cancel order
- `GET /api/v1/admin/orders` - All orders (admin)
- `PUT /api/v1/admin/orders/:id/status` - Update status

**Order Statuses:**
1. `pending` - Chờ xác nhận
2. `confirmed` - Đã xác nhận
3. `shipped` - Đang giao
4. `delivered` - Đã giao
5. `paid` - Đã thanh toán
6. `cancelled` - Đã hủy

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cart state sync issues | Medium | Use server state as source of truth, optimistic UI |
| Token expiry mid-checkout | High | Auto-refresh đã implement, add loading states |
| i18n missing translations | Low | Add keys incrementally, fallback to Vietnamese |
| Mobile responsiveness | Medium | Test on mobile, use Tailwind responsive classes |

## Success Criteria

1. User có thể đăng ký, đăng nhập, đăng xuất
2. User có thể thêm sản phẩm vào giỏ, chỉnh số lượng, xóa
3. User có thể checkout và tạo đơn hàng
4. User có thể xem lịch sử đơn hàng và chi tiết
5. User có thể hủy đơn hàng (nếu pending)
6. Admin có thể xem và cập nhật trạng thái đơn hàng

## Estimated Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Auth UI | 2-3 days | Login, Register, Logout |
| Cart UI | 2-3 days | Cart page, Add-to-cart |
| Checkout | 2-3 days | Shipping form, Order creation |
| Order Pages | 3-4 days | History, Detail, Admin |
| **Total** | **~2 weeks** | Complete Phase 3 |

---

## Next Steps

1. Create detailed implementation plan với `/ck:plan`
2. Start với Auth UI (dependency cho Cart/Order)
3. Test từng feature trước khi move on

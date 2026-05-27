# Brainstorm Report: Order Code Feature

**Date:** 2026-05-27
**Status:** Approved

## Problem Statement
Orders hiện dùng UUID làm identifier, không thân thiện với user. Cần thêm mã đơn hàng human-readable để hiển thị cho customer và admin.

## Requirements
- Format: `ROL-YYMMDD-XXX` (VD: ROL-260527-001)
- Unique constraint
- Daily sequence reset (001-999/ngày)
- Backfill cho orders cũ đã tồn tại
- Hiển thị trên order list (customer + admin)

## Evaluated Approaches

### Option 1: Database-Level Sequence (SELECTED)
- Thêm table `order_code_sequences` lưu sequence theo ngày
- Transaction + row lock đảm bảo atomic increment
- **Pros:** Concurrency-safe, reliable
- **Cons:** Cần thêm 1 table phụ

### Option 2: Application-Level Generation (Rejected)
- Generate code trong Go, query max + 1
- **Pros:** Đơn giản, không cần table phụ
- **Cons:** Race condition risk, cần retry logic

## Final Solution

### Database Schema
```sql
-- orders table
ALTER TABLE orders ADD COLUMN order_code VARCHAR(15);
CREATE UNIQUE INDEX idx_orders_order_code ON orders(order_code);

-- sequence table
CREATE TABLE order_code_sequences (
    date_key VARCHAR(6) PRIMARY KEY,  -- YYMMDD
    last_sequence INT NOT NULL DEFAULT 0
);
```

### Code Generation Logic
1. Get or create sequence row for current date (với row lock)
2. Increment `last_sequence`
3. Format: `ROL-{date_key}-{sequence:03d}`
4. Insert order với generated code

### Files to Modify
**Backend:**
- `models/order.go` - Add OrderCode field
- `dto/order_dto.go` - Add to DTO
- `services/order_service.go` - Generate code on create
- New: `repositories/order_code_repo.go` - Sequence management
- New: `models/order_code_sequence.go` - Sequence model
- Migrations: 2 files (add column, create sequence table)

**Frontend:**
- `types/api.ts` - Add order_code to Order type
- `orders/page.tsx` - Display column
- `admin/orders/page.tsx` - Display column
- `orders/[id]/page.tsx` - Display in header

### Migration Strategy
1. Add nullable `order_code` column
2. Create sequence table
3. Backfill existing orders by `created_at` order
4. Alter column to NOT NULL

## Risk Assessment
| Risk | Severity | Mitigation |
|------|----------|------------|
| Race condition | Medium | DB transaction + row lock |
| Sequence overflow | Low | Extend to 4 digits if needed |
| Migration failure | Medium | Test on staging first |

## Success Criteria
- [ ] All orders have unique order_code
- [ ] New orders auto-generate code on creation
- [ ] Order list pages show "Mã đơn hàng" column
- [ ] Order detail shows order code
- [ ] No duplicate codes under concurrent load

## Next Steps
Create implementation plan with phases:
1. Database migrations
2. Backend model/service changes
3. Frontend display updates
4. Testing & validation

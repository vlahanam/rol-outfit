# Journal: Remove User Address Field + Order Shipping Update

**Date:** 2026-05-26 22:36
**Severity:** Medium
**Component:** Users, Orders
**Status:** Resolved

## What Happened

The team executed a significant pivot from the original "User Addresses Feature" plan. Instead of creating a separate `user_addresses` table with full CRUD operations, we:

1. Removed the `address` field from the `users` table (migration 000021)
2. Added a `PUT /api/v1/orders/:id/shipping` endpoint for partial shipping info updates
3. Updated User DTOs to remove address references
4. Updated all frontend forms (registration, admin pages) to remove address input
5. Fixed the seeder to stop trying to set address fields
6. Added i18n translations for the new error message

All 16 order-related tests pass (100% coverage), including comprehensive status validation checks.

## The Brutal Truth

We had a plan. Then we threw it out.

The original brainstorm and plan committed us to a full multi-address feature with a separate table, CRUD endpoints, max 5 addresses per user, default address logic, and checkout integration. It was well-thought-out and technically sound. But somewhere in the execution chain, someone (reasonably) said: "Wait, do we actually need all of this right now?"

And they were right.

The pivot makes sense: users need to update shipping info on orders after they're created (because checkout info might be stale or incomplete). That's a real need. A full address management system with default addresses? That's nice-to-have complexity we don't need blocking shipping workflows.

The frustrating part is that this decision wasn't documented in the plan before implementation started. So from a planning standpoint, this is a failure. From a delivery standpoint, it's actually pragmatic. We shipped something useful without the bloat.

## Technical Details

### Database Changes

Two migrations, opposite purposes:
- **000020**: Creates `user_addresses` table (partial work that got repurposed)
- **000021**: Drops `address` column from `users` table

The `user_addresses` table still exists but isn't being used. It was created during phase 1 of the original plan. Instead of building out the full feature, we pivoted to a simpler shipping update flow.

### API Endpoint

**PUT /api/v1/orders/:id/shipping**

Request body uses pointer fields for true partial updates:
```go
type UpdateOrderShippingRequest struct {
    ShippingAddress *string `json:"shipping_address"`
    Phone           *string `json:"phone"`
    Note            *string `json:"note"`
}
```

This allows callers to update:
- Just phone number
- Just address
- Just note
- Any combination

Response: 204 No Content on success.

### Business Rules (Service Layer)

The critical rule is enforced at `order_service.UpdateShippingInfo()`:

```
Only PENDING orders can have shipping info updated.
```

Error: `ErrCannotUpdateShipping` → HTTP 409 Conflict
Message: "Không thể cập nhật thông tin giao hàng cho đơn hàng đã được xử lý" (Vietnamese)
Message: "処理中の注文の配送情報は変更できません" (Japanese)

Authorization is handled at the service layer:
- User can only update their own orders (checked via `userID` + `orderID`)
- If order not found or not owned, appropriate errors returned

### Test Coverage

16 tests in `order_service_test.go`:

- `TestUpdateShippingInfo_Success`: Happy path ✓
- `TestUpdateShippingInfo_NonPendingOrder`: Validates status check for all 6 order statuses ✓
- `TestUpdateShippingInfo_OrderNotFound`: 404 scenario ✓
- `TestUpdateShippingInfo_OrderNotOwned`: Authorization check ✓
- `TestUpdateShippingInfo_PartialUpdate_OnlyPhone`: Partial update ✓
- `TestUpdateShippingInfo_EmptyRequest`: No-op validation ✓
- `TestUpdateShippingInfo_AllStatuses`: Comprehensive status matrix ✓
- Plus 8 more status-specific tests ✓

All pass. No edge cases slipped through.

### i18n Integration

New error key added to all locale files:
- `error.cannot_update_shipping` in `vi.json` (Vietnamese)
- `error.cannot_update_shipping` in `ja.json` (Japanese)
- Already existed in other locales

Controller checks language from Accept-Language header and returns localized error messages. This is standard pattern in the codebase.

### Code Review Findings

Code reviewer flagged one thing:
- Missing i18n key `error.cannot_update_shipping` in vi.json and ja.json

**Action taken:** Added both keys with proper translations.

## What We Tried

1. **Completed option 1:** Full user_addresses feature per plan
   - Status: Started (migration created) but abandoned
   - Reason: Complexity overkill; didn't match actual shipping need

2. **Switched to option 2:** Simpler shipping update endpoint
   - Status: Completed and tested
   - Reason: Matches the real problem (update shipping after order created)

No actual false starts here—it was a deliberate pivot. The migration for user_addresses got created as dead code, which is the real waste.

## Root Cause Analysis

**Why did we deviate from the plan?**

The plan was based on a feature request from a brainstorm: "Users need multiple delivery addresses with 1 default address for checkout auto-fill."

But the real, immediate problem is simpler: "Orders need editable shipping info after creation." The brainstorm addressed the future multi-address use case. We optimized for now.

The root cause of the planning failure is: **requirements weren't locked down before delegating to implementation**. The brainstorm and plan got approved, but the execution happened asynchronously with a different understanding of priority.

This could have been caught earlier with:
1. A pre-implementation sync call with the plan lead
2. A "plan revision" step if scope changes
3. Better async communication channels for course corrections

## Lessons Learned

### What We Should Do Differently

1. **Lock scope before implementation starts**
   - Brainstorm → Plan approval → Approval includes final scope confirmation
   - If scope changes during implementation, pause and revise the plan, don't just pivot

2. **Document architectural pivots**
   - We have a `user_addresses` table that's unused
   - This is technical debt. Future devs will ask: "Why does this table exist?"
   - Should have a commit message explaining: "Creating user_addresses table for future use, currently using order shipping update for immediate need"

3. **Cleanup incomplete work**
   - The user_addresses table and unused endpoints create confusion
   - Either: commit to the full feature, or clean up the partial work
   - Half-implemented features are worse than no features

4. **Communication pattern for subagents**
   - If a subagent finds the plan doesn't match actual needs, they should flag it and wait for clarification
   - Don't assume a pivot is the right call—escalate and let humans decide

### What Went Right

- Tests caught nothing because the shipping update logic itself is solid
- i18n integration was considered and fixed
- Partial updates with pointer fields is actually good API design
- Authorization and status checks are at the right layers (service, not controller)
- Code is clean and follows existing patterns

## Next Steps

**Immediate (must do):**
1. Delete or deprecate the unused `user_addresses` table
   - Option A: Create migration 000022 to drop it entirely
   - Option B: Leave it and document via code comment why it exists

2. Clarify with product/design: Do we want the full address feature later?
   - If yes: plan it properly for a future sprint
   - If no: clean up the dead code

3. Update the plan status in `260526-2147-user-addresses-feature/plan.md`
   - Current status says "completed" but that's misleading
   - Should say "partially implemented (shipping update)" or "superseded"

**Owner:** Lead engineer or product manager needs to decide on the user_addresses table fate.

**Timeline:** Before next major release. The dead table isn't critical, but it's noise.

## Questions for Future Investigation

1. Was the pivot intentional and communicated, or accidental?
2. Why wasn't the plan.md updated to reflect the scope change?
3. Are there other incomplete features from abandoned plans taking up DB space?
4. Should we add a "dead code audit" to the QA checklist?

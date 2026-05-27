# Order Code Feature Implementation Complete

**Date**: 2026-05-28 14:30
**Severity**: Low
**Component**: Orders / Order Display
**Status**: Resolved

## What Happened

Implemented human-readable order codes (format: ROL-YYMMDD-XXXX) to replace UUID display in customer-facing order pages. Feature includes PostgreSQL UPSERT sequence generation, migrations, backend service logic, and frontend type updates.

## The Brutal Truth

This was straightforward but almost shipped with a catastrophic bug. Code reviewer caught that 3-digit sequences (999 max) would overflow if more than 999 orders landed on the same day. That's not theoretical—it would break production silently. We're operating an e-commerce platform; peak days will exceed that. The 4-digit fix was instant but the fact we didn't catch it during implementation is embarrassing.

## Technical Details

- **Sequence table**: Daily UPSERT pattern ensures atomic increments under concurrent checkout load
- **Migration 000022**: Added `order_code VARCHAR(20)` nullable column to `orders` table
- **Migration 000023**: Created `daily_order_sequences` table with partial unique index on (date) WHERE order_code IS NOT NULL
- **Fallback logic**: Frontend displays truncated UUID for legacy orders without codes (graceful degradation)

## What We Tried

Initial design used 3-digit sequence (0001-999). Code review revealed overflow risk mid-implementation. Expanded to 4-digit (0001-9999) allowing 10k orders/day—reasonable headroom for current traffic projections.

## Root Cause Analysis

Didn't model worst-case daily order volume during design. We assumed moderate traffic but skipped the sanity check: "What if we have a viral day?" This is a classic feature-dev mistake—optimize for happy path, ignore edge cases.

## Lessons Learned

- **Always model bounds**: For any sequence/counter, calculate daily max and question assumptions
- **Code review saved us**: Caught design flaw before merge; proves value of peer review on concurrency logic
- **TypeScript optionality matters**: Fixed type inconsistencies (non-optional vs empty string) to avoid runtime surprises

## Next Steps

- Add unit tests for sequence generation (noted in review; deferred to next sprint)
- Monitor daily order counts in production—alert if approaching 9999 threshold
- Consider migrating legacy orders to codes (low priority; fallback handles it)

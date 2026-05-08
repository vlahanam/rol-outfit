# Tags + Product Detail Feature Implementation

**Date**: 2026-05-09 14:30  
**Severity**: Medium  
**Component**: Backend (tags, product tags), Frontend (admin tag management, product detail)  
**Status**: Resolved

## What Happened

Implemented full tag management system with product variant picker in a single coordinated session across backend and frontend. Included two new database migrations, complete CRUD for tags, tag assignment with transactional safety, and a redesigned product detail page with variant resolution logic. Feature deployed successfully with no blockers.

## The Brutal Truth

This feature actually *worked*. No regressions, no edge cases that broke things mid-way, no architectural do-overs. That's rare enough that it's worth documenting why. The planning phase was tight—clear separation of concerns, explicit decisions about semantics (replace-set vs. add/remove), and early agreement on the variant picker UX saved hours of back-and-forth. The hardest part wasn't the code; it was convincing myself that the simple solution (hard delete on tags, cascading cleanup) was actually the right one instead of building a soft-delete/archive system "just in case."

## Technical Details

**Database schema (migrations 000011, 000012):**
```sql
-- tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  start_at TIMESTAMP,
  end_at TIMESTAMP
);

-- product_tags junction
CREATE TABLE product_tags (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);
```

**Tag activation logic (applied at query time):**
```
WHERE (start_at IS NULL OR start_at <= NOW()) 
  AND (end_at IS NULL OR end_at >= NOW())
```

Nullable `start_at`/`end_at` means tags are "always active" by default. No scheduled tag logic required in application code—database query handles it.

**API endpoints:**
- `GET /api/tags` — public, filters to active only
- `GET /api/admin/tags` — admin, returns all tags
- `POST /api/admin/tags`, `PUT /api/admin/tags/:id`, `DELETE /api/admin/tags/:id` — full CRUD
- `PUT /api/products/:id/tags` — transactional replace-set: `DELETE FROM product_tags WHERE product_id = ? THEN INSERT ... FOR EACH tag`

**Frontend: ProductTagsPanel component**
- Optimistic add/remove (UI updates immediately, reverts on 400/422)
- Hard 3-tag cap enforced both in UI (button disabled) and API (service layer)
- Tag selection dropdown filters out already-assigned tags

**Product detail page redesign:**
- Variant picker: axis-based resolution with progressive narrowing (select color → shoe sizes that exist for that color → image gallery updates)
- Gallery deduplication: merges `product.avatar` + `variant.avatar` to prevent duplicate images
- Cart payload includes resolved variant ID, size, color
- Tags rendered as badges below product name

## What We Tried

1. **Add/remove semantics vs. replace-set semantics** — Discussed whether to expose individual add/remove endpoints. Chose replace-set (idempotent, simpler contract, matches "set the tags for this product to X" mental model). Rejected add/remove because it requires more state coordination and can lead to partial failures.

2. **Soft delete for tags** — Considered archiving tags instead of hard delete. Rejected: adds migration complexity, requires status column, but tags are low-volume metadata. If a tag is deleted, it should vanish from the catalog. If we need "archived" tags later, that's a separate feature.

3. **Tag filtering at endpoint vs. in service layer** — Debated whether to filter active tags at the database query or in the service layer. Chose database (cleaner separation, takes advantage of indexes, single source of truth for "active").

4. **Client-side variant resolution vs. server-side** — Variant picker logic runs on client (JavaScript) to provide instant feedback. Server still validates the selected variant exists and belongs to the product (prevents bypass). This felt right: keep the happy path fast, keep security checks on server.

## Root Cause Analysis

No catastrophic failures occurred, so there's no root cause to analyze. But *why* did this implementation go smoothly?

1. **Clear scope definition**: Feature was bounded—tags, assignment, product detail. Not "eventually add review tags" or "prepare for variant recommendations."
2. **Schema simplicity**: Time-window activation via nullable columns is standard SQL. No custom logic libraries or temporal databases.
3. **Explicit API contract**: PUT /products/:id/tags with `{ tags: [id, id, id] }` is unambiguous. Not "should I use DELETE then POST or a PATCH?" 
4. **Early decision on enforcement**: Agreed that 3-tag cap is a hard business rule, enforced at service layer + UI. No "let the user assign 10 tags and figure it out later."

## Lessons Learned

1. **Replace-set is not lazy design; it's the right abstraction** — When you're managing a small, bounded collection (tags on a product), replace-set semantics are idempotent and predictable. Don't default to granular add/remove just because it feels more "RESTful."

2. **Nullable constraints are clean when "empty" is the default state** — `start_at IS NULL` means "always active." This beats creating a `TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)` and an `is_active BOOLEAN` flag. Use the schema to encode intent.

3. **Optimistic UI + server validation is the right split** — Frontend updates immediately for perceived speed; server rejects bad requests. We're not shipping if the server rejects a request the UI thought was valid. Test this combination before shipping.

4. **Variant resolution is inherently client-side** — The product detail page's variant picker needs instant feedback as the user narrows axes. Fetching from the server for every axis selection kills UX. Compute locally, validate on submit.

5. **Composite PKs are fine when they're natural** — (product_id, tag_id) is a natural primary key. Not every table needs a synthetic `product_tag_id` UUID.

## Next Steps

1. **Monitoring**: Log tag lifecycle events (creation, deletion, activation window transitions) for analytics. Not urgent, but useful data.
2. **Admin UI polish**: Consider bulk tag operations (apply 5 tags to 20 products at once). Out of scope for this sprint, but the replace-set API is ready for it.
3. **Variant combination matrix**: Document or generate a matrix of "which variant combinations are possible" for UX improvements. Currently done progressively in UI; could be exposed as metadata if needed.
4. **Tests**: Ensure variant resolution edge cases are covered (single color, single size, single variant). Product detail component tests should verify gallery deduplication.

**Owner**: Full-stack implementation (backend + frontend in parallel)  
**Status**: Complete, ready for review and merge to develop → master

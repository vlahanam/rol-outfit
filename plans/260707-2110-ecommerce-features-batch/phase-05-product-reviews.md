# Phase 5: Product Review System

## Context Links
- Order model: `/backend/src/internal/models/order.go` (ORDER_STATUS_COMPLETED = 5)
- Product model: `/backend/src/internal/models/product.go`
- Order repository: `/backend/src/internal/repositories/order_repo.go`
- Product detail page: `/frontend/app/[locale]/(main)/product/[id]/page.tsx`
- Admin pages: `/frontend/app/admin/(protected)/`
- Routes: `/backend/src/internal/initialize/route.go`

## Overview
- **Priority:** P2 (most complex feature)
- **Status:** pending
- **Effort:** 10 hours

Full product review system with user submissions, admin moderation, and display on product pages.

## Key Insights
- Only users who completed purchase should review (order status >= COMPLETED)
- Reviews need moderation (pending -> approved/rejected)
- Average rating calculated on-the-fly or cached
- One review per user per product (prevent duplicates)

## Requirements

### Functional

**User-facing:**
- View approved reviews on product detail page
- See average rating and rating distribution
- Submit review if logged in AND purchased product
- Edit/delete own review (optional, phase 2)

**Admin:**
- List all reviews with filters (status, product, user)
- Approve/reject pending reviews
- Delete any review
- View review statistics

### Non-Functional
- Pagination for reviews list (10 per page)
- Cache average rating (optional optimization)
- Rate limiting on review submission

## Architecture

### Database Schema

```sql
-- Migration: 000011_add_product_reviews.up.sql
CREATE TABLE product_reviews (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID           NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id     UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id    UUID           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rating      SMALLINT       NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT           NOT NULL DEFAULT '',
    status      SMALLINT       NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id)
);

COMMENT ON COLUMN product_reviews.status IS '1: pending, 2: approved, 3: rejected';

CREATE INDEX idx_reviews_product_status ON product_reviews(product_id, status);
CREATE INDEX idx_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_reviews_status ON product_reviews(status);
CREATE INDEX idx_reviews_created ON product_reviews(created_at DESC);
```

```sql
-- Migration: 000011_add_product_reviews.down.sql
DROP TABLE IF EXISTS product_reviews;
```

### Data Flow

```
User submits review
  -> Verify JWT token (user_id)
  -> Check user has completed order for product
  -> Check no existing review for this product
  -> Create review (status=pending)
  -> Admin approves
  -> Review visible on product page

Product detail page
  -> GET /api/v1/products/:id/reviews (approved only)
  -> Display reviews + average rating
```

### Component Structure

```
Backend:
  models/product_review.go
  repositories/product_review_repo.go
  services/product_review_service.go
  controllers/product_review_controller.go
  requests/product_review_request.go
  dto/product_review_dto.go

Frontend:
  components/product/reviews-section.tsx
  components/product/review-form.tsx
  components/product/star-rating.tsx
  app/admin/(protected)/reviews/page.tsx
```

## Related Code Files

### Files to Create

**Backend:**
- `backend/database/migrations/000011_add_product_reviews.up.sql`
- `backend/database/migrations/000011_add_product_reviews.down.sql`
- `backend/src/internal/models/product_review.go`
- `backend/src/internal/repositories/product_review_repo.go`
- `backend/src/internal/services/product_review_service.go`
- `backend/src/internal/controllers/product_review_controller.go`
- `backend/src/internal/requests/product_review_request.go`
- `backend/src/internal/dto/product_review_dto.go`

**Frontend:**
- `frontend/components/product/star-rating.tsx`
- `frontend/components/product/review-form.tsx`
- `frontend/components/product/reviews-section.tsx`
- `frontend/app/admin/(protected)/reviews/page.tsx`

### Files to Modify

**Backend:**
- `backend/src/internal/initialize/route.go`
- `backend/src/internal/repositories/gorm.go` (add interface)

**Frontend:**
- `frontend/app/[locale]/(main)/product/[id]/page.tsx`
- `frontend/types/api.ts`
- `frontend/lib/api-resources.ts`

## Implementation Steps

### Step 1: Database Migration

Create migration files as shown in schema above.

Run: `make migrate-up` or equivalent

### Step 2: Backend Model

```go
// backend/src/internal/models/product_review.go
package models

import "time"

const (
    REVIEW_STATUS_PENDING  = int8(1)
    REVIEW_STATUS_APPROVED = int8(2)
    REVIEW_STATUS_REJECTED = int8(3)
)

type ProductReview struct {
    ID        string    `gorm:"type:uuid;primaryKey"`
    ProductID string    `gorm:"column:product_id;type:uuid"`
    UserID    string    `gorm:"column:user_id;type:uuid"`
    OrderID   string    `gorm:"column:order_id;type:uuid"`
    Rating    int8      `gorm:"column:rating"`
    Comment   string    `gorm:"column:comment"`
    Status    int8      `gorm:"column:status"`
    CreatedAt time.Time `gorm:"column:created_at"`
    UpdatedAt time.Time `gorm:"column:updated_at"`
}

func (ProductReview) TableName() string { return "product_reviews" }

// ReviewWithUser for display (joined with user info)
type ReviewWithUser struct {
    *ProductReview
    UserName string
}

// ReviewStats for aggregated data
type ReviewStats struct {
    AverageRating float64
    TotalCount    int
    Distribution  map[int]int // rating -> count
}
```

### Step 3: Backend Repository

```go
// backend/src/internal/repositories/product_review_repo.go
package repositories

import (
    "context"
    "github.com/vlahanam/rol-outfit/src/internal/models"
)

type ProductReviewRepository interface {
    Create(ctx context.Context, review *models.ProductReview) error
    GetByID(ctx context.Context, id string) (*models.ProductReview, error)
    GetByUserAndProduct(ctx context.Context, userID, productID string) (*models.ProductReview, error)
    ListByProduct(ctx context.Context, productID string, status int8, offset, limit int) ([]*models.ReviewWithUser, int, error)
    ListAll(ctx context.Context, status int8, search string, offset, limit int) ([]*models.ReviewWithUser, int, error)
    UpdateStatus(ctx context.Context, id string, status int8) error
    Delete(ctx context.Context, id string) error
    GetStats(ctx context.Context, productID string) (*models.ReviewStats, error)
    UserHasPurchased(ctx context.Context, userID, productID string) (bool, string, error) // returns orderID
}
```

### Step 4: Backend Service

```go
// backend/src/internal/services/product_review_service.go
package services

import (
    "context"
    "errors"
    "github.com/google/uuid"
    "github.com/vlahanam/rol-outfit/src/internal/models"
    "github.com/vlahanam/rol-outfit/src/internal/repositories"
    "github.com/vlahanam/rol-outfit/src/internal/requests"
)

var (
    ErrReviewNotFound      = errors.New("review not found")
    ErrAlreadyReviewed     = errors.New("user already reviewed this product")
    ErrNotPurchased        = errors.New("user has not purchased this product")
    ErrInvalidRating       = errors.New("rating must be between 1 and 5")
)

type ProductReviewService interface {
    Create(ctx context.Context, userID string, req *requests.CreateReviewRequest) (*models.ProductReview, error)
    ListByProduct(ctx context.Context, productID string, page, limit int) ([]*models.ReviewWithUser, int, error)
    ListAll(ctx context.Context, status int8, search string, page, limit int) ([]*models.ReviewWithUser, int, error)
    GetStats(ctx context.Context, productID string) (*models.ReviewStats, error)
    Approve(ctx context.Context, id string) error
    Reject(ctx context.Context, id string) error
    Delete(ctx context.Context, id string) error
    CanUserReview(ctx context.Context, userID, productID string) (bool, error)
}
```

### Step 5: Backend Controller

```go
// backend/src/internal/controllers/product_review_controller.go
// Handlers:
// - GET  /api/v1/products/:id/reviews        (public, approved only)
// - GET  /api/v1/products/:id/reviews/stats  (public)
// - GET  /api/v1/products/:id/reviews/can-review (auth, check eligibility)
// - POST /api/v1/products/:id/reviews        (auth, create review)
// - GET  /api/v1/admin/reviews               (admin, list all)
// - PUT  /api/v1/admin/reviews/:id/approve   (admin)
// - PUT  /api/v1/admin/reviews/:id/reject    (admin)
// - DELETE /api/v1/admin/reviews/:id         (admin)
```

### Step 6: Backend Routes

```go
// Add to route.go

// Public product reviews
prods.Get("/:id/reviews", controllers.ListProductReviews(db))
prods.Get("/:id/reviews/stats", controllers.GetReviewStats(db))

// User review actions (auth required)
prodReviews := prods.Group("/:id/reviews", middleware.JWTAuth(jwtSecret))
prodReviews.Get("/can-review", controllers.CanUserReview(db))
prodReviews.Post("/", controllers.CreateReview(db))

// Admin reviews
adminReviews := v1.Group("/admin/reviews",
    middleware.JWTAuth(jwtSecret),
    middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
)
adminReviews.Get("/", controllers.AdminListReviews(db))
adminReviews.Put("/:id/approve", controllers.ApproveReview(db))
adminReviews.Put("/:id/reject", controllers.RejectReview(db))
adminReviews.Delete("/:id", controllers.DeleteReview(db))
```

### Step 7: Frontend Types

```typescript
// Add to types/api.ts

export interface ProductReview {
    id: string;
    product_id: string;
    user_id: string;
    user_name: string;
    rating: number;
    comment: string;
    status: number;
    created_at: string;
}

export interface ReviewStats {
    average_rating: number;
    total_count: number;
    distribution: Record<number, number>;
}

export interface CreateReviewPayload {
    rating: number;
    comment: string;
}
```

### Step 8: Frontend API Resources

```typescript
// Add to api-resources.ts

export const productReviews = {
    list(productId: string, page = 1, limit = 10): Promise<ApiResponse<ProductReview[]>> {
        return request<ApiResponse<ProductReview[]>>(
            `/products/${productId}/reviews?page=${page}&limit=${limit}`
        );
    },
    getStats(productId: string): Promise<{ data: ReviewStats }> {
        return request<{ data: ReviewStats }>(`/products/${productId}/reviews/stats`);
    },
    canReview(productId: string): Promise<{ data: { can_review: boolean; reason?: string } }> {
        return request<{ data: { can_review: boolean; reason?: string } }>(
            `/products/${productId}/reviews/can-review`
        );
    },
    create(productId: string, body: CreateReviewPayload): Promise<{ data: ProductReview }> {
        return request<{ data: ProductReview }>(`/products/${productId}/reviews`, {
            method: "POST",
            body: JSON.stringify(body),
        });
    },
};

export const adminReviews = {
    list(params?: { page?: number; limit?: number; status?: number; search?: string }): Promise<ApiResponse<ProductReview[]>> {
        const qs = new URLSearchParams();
        if (params?.page) qs.set("page", String(params.page));
        if (params?.limit) qs.set("limit", String(params.limit));
        if (params?.status) qs.set("status", String(params.status));
        if (params?.search) qs.set("search", params.search);
        const query = qs.toString();
        return request<ApiResponse<ProductReview[]>>(`/admin/reviews${query ? `?${query}` : ""}`);
    },
    approve(id: string): Promise<void> {
        return request<void>(`/admin/reviews/${id}/approve`, { method: "PUT" });
    },
    reject(id: string): Promise<void> {
        return request<void>(`/admin/reviews/${id}/reject`, { method: "PUT" });
    },
    remove(id: string): Promise<void> {
        return request<void>(`/admin/reviews/${id}`, { method: "DELETE" });
    },
};
```

### Step 9: Frontend Components

**StarRating component:**
```typescript
// frontend/components/product/star-rating.tsx
interface Props {
    value: number;
    onChange?: (value: number) => void;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
}
```

**ReviewForm component:**
```typescript
// frontend/components/product/review-form.tsx
interface Props {
    productId: string;
    onSuccess: () => void;
}
```

**ReviewsSection component:**
```typescript
// frontend/components/product/reviews-section.tsx
interface Props {
    productId: string;
}
// Displays stats, review list, and form if eligible
```

### Step 10: Admin Reviews Page

Create `/frontend/app/admin/(protected)/reviews/page.tsx`:
- Table with columns: Product, User, Rating, Comment, Status, Date, Actions
- Filter by status (all, pending, approved, rejected)
- Search by product name or user
- Approve/Reject/Delete buttons

## Todo List

### Backend
- [ ] Create migration files (up + down)
- [ ] Run migration
- [ ] Create ProductReview model
- [ ] Create ProductReviewRepository interface + implementation
- [ ] Create ProductReviewService
- [ ] Create request/DTO structs
- [ ] Create controller handlers
- [ ] Register routes
- [ ] Write unit tests for service
- [ ] Write integration tests for endpoints

### Frontend
- [ ] Add types to api.ts
- [ ] Add API functions to api-resources.ts
- [ ] Create StarRating component
- [ ] Create ReviewForm component
- [ ] Create ReviewsSection component
- [ ] Integrate ReviewsSection into product detail page
- [ ] Create admin reviews page
- [ ] Add admin nav link to reviews
- [ ] Add translation keys
- [ ] Test full flow

## Success Criteria
- [ ] User can submit review for purchased product
- [ ] Review requires 1-5 star rating
- [ ] Reviews appear as pending until approved
- [ ] Product page shows approved reviews + average rating
- [ ] Admin can list/filter/approve/reject/delete reviews
- [ ] One review per user per product enforced
- [ ] Non-purchasers cannot submit reviews

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Review spam | Medium | Medium | Rate limiting, moderation queue |
| Fake purchases to review | Low | Medium | Verify order status = completed |
| Performance with many reviews | Low | Medium | Pagination, consider caching stats |
| Migration failure | Low | High | Test on staging first |

## Security Considerations
- JWT required for review submission
- User can only review products they purchased
- Admin-only moderation endpoints
- Sanitize comment content (XSS prevention)
- Rate limit review submissions (1 per product per user enforced by DB)

## Test Cases

### Unit Tests (Service)
1. Create review - success
2. Create review - not purchased -> error
3. Create review - already reviewed -> error
4. Create review - invalid rating -> error
5. List reviews - filters by status
6. Get stats - calculates average correctly

### Integration Tests (API)
1. POST /products/:id/reviews - unauthorized -> 401
2. POST /products/:id/reviews - not purchased -> 403
3. POST /products/:id/reviews - success -> 201
4. GET /products/:id/reviews - returns approved only
5. PUT /admin/reviews/:id/approve - changes status
6. DELETE /admin/reviews/:id - removes review

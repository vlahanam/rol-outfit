---
phase: 3
title: Controller & Routes
status: pending
---

# Phase 3: Controller & Routes

## Files to Create/Modify

- **Create:** `backend/src/internal/controllers/product_variant_controller.go`
- **Modify:** `backend/src/internal/initialize/route.go`

## Controller Handlers

```go
ListVariants(db)   // GET  /products/:productID/variants
GetVariant(db)     // GET  /products/:productID/variants/:id
CreateVariant(db)  // POST /products/:productID/variants       [admin]
UpdateVariant(db)  // PUT  /products/:productID/variants/:id   [admin]
DeleteVariant(db)  // DELETE /products/:productID/variants/:id [admin]
```

Each handler:
1. Parse `productID` param, validate UUID
2. Validate `id` param (for single-item ops)
3. Bind & validate request body (for create/update)
4. Call service method
5. Return appropriate status code + JSON

## Error Mapping

| Service Error | HTTP Status |
|---------------|-------------|
| `ErrVariantNotFound` | 404 |
| `ErrVariantForbidden` | 404 (expose as not found, don't leak ownership) |
| other | 500 |

## Route Registration (in route.go)

```go
// Variants — nested under products
variants := v1.Group("/products/:productID/variants")
variants.Get("/", controllers.ListVariants(db))
variants.Get("/:id", controllers.GetVariant(db))
adminVariants := variants.Use(middleware.JWTAuth(jwtSecret), middleware.RequireRole(float64(models.USER_ROLE_ADMIN)))
adminVariants.Post("/", controllers.CreateVariant(db))
adminVariants.Put("/:id", controllers.UpdateVariant(db))
adminVariants.Delete("/:id", controllers.DeleteVariant(db))
```

Insert this block after the Products routes block.

## Todo

- [ ] Create `controllers/product_variant_controller.go`
- [ ] Update `initialize/route.go` to register variant routes

# Phase 2: Backend Implementation

**Status:** pending | **Effort:** 45min | **Priority:** high

## Overview
Implement full backend CRUD for user addresses following existing Clean Architecture pattern.

## Files to Create

### 1. Model (`backend/src/internal/models/user_address.go`)
```go
package models

import (
  "time"
  "gorm.io/gorm"
)

type UserAddress struct {
  ID            string         `gorm:"type:uuid;primaryKey"`
  UserID        string         `gorm:"type:uuid;not null"`
  RecipientName string         `gorm:"column:recipient_name;size:100"`
  Phone         string         `gorm:"column:phone;size:15"`
  Address       string         `gorm:"column:address;type:text"`
  IsDefault     bool           `gorm:"column:is_default;default:false"`
  CreatedAt     time.Time      `gorm:"column:created_at"`
  UpdatedAt     time.Time      `gorm:"column:updated_at"`
  DeletedAt     gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (UserAddress) TableName() string {
  return "user_addresses"
}
```

### 2. DTO (`backend/src/internal/dto/user_address_dto.go`)
```go
package dto

type UserAddressDTO struct {
  ID            string `json:"id"`
  RecipientName string `json:"recipient_name"`
  Phone         string `json:"phone"`
  Address       string `json:"address"`
  IsDefault     bool   `json:"is_default"`
  CreatedAt     string `json:"created_at"`
  UpdatedAt     string `json:"updated_at"`
}
```

### 3. Requests (`backend/src/internal/requests/user_address_request.go`)
- `CreateAddressRequest`: recipient_name, phone, address (all required)
- `UpdateAddressRequest`: all optional pointers

### 4. Repository (`backend/src/internal/repositories/user_address_repo.go`)
Interface methods:
- `Create(ctx, address)` - with max 5 check
- `ListByUserID(ctx, userID)` - return all non-deleted
- `FindByID(ctx, id)` - single lookup
- `Update(ctx, id, fields)` - partial update
- `SoftDelete(ctx, id)` - soft delete
- `SetDefault(ctx, userID, addressID)` - transaction: unset all, set one
- `CountByUserID(ctx, userID)` - for max 5 validation

### 5. Service (`backend/src/internal/services/user_address_service.go`)
Business logic:
- Create: check max 5, auto-set default if first
- SetDefault: use repo transaction
- Delete: prevent deleting default if others exist

### 6. Controller (`backend/src/internal/controllers/user_address_controller.go`)
Handlers:
- `ListAddresses` - GET /addresses
- `CreateAddress` - POST /addresses
- `UpdateAddress` - PUT /addresses/:id
- `DeleteAddress` - DELETE /addresses/:id
- `SetDefaultAddress` - PUT /addresses/:id/default

## Files to Modify

### Route Registration (`backend/src/internal/initialize/route.go`)
Add routes under authenticated user group:
```go
addresses := api.Group("/addresses", jwtMiddleware)
addresses.Get("/", addressController.ListAddresses)
addresses.Post("/", addressController.CreateAddress)
addresses.Put("/:id", addressController.UpdateAddress)
addresses.Delete("/:id", addressController.DeleteAddress)
addresses.Put("/:id/default", addressController.SetDefaultAddress)
```

## Error Codes
- `400` - Max 5 addresses reached
- `400` - Cannot delete default (set another first)
- `403` - Address belongs to another user
- `404` - Address not found

## Todo
- [ ] Create model
- [ ] Create DTO
- [ ] Create requests with validation
- [ ] Create repository interface + implementation
- [ ] Create service with business logic
- [ ] Create controller handlers
- [ ] Register routes
- [ ] Test endpoints with curl/Postman

# Phase 2: Backend Model + Repository

## Overview
- **Priority:** High
- **Status:** complete
- **Effort:** 45m

## Files to Modify
- `backend/src/internal/models/order.go` - Add OrderCode field

## Files to Create
- `backend/src/internal/models/order_code_sequence.go` - Sequence model
- `backend/src/internal/repositories/order_code_repo.go` - Sequence repository

## Implementation

### 1. Update Order Model
**File:** `backend/src/internal/models/order.go`

Add field after `Note`:
```go
OrderCode *string `gorm:"column:order_code;type:varchar(15)"`
```

### 2. Create Sequence Model
**File:** `backend/src/internal/models/order_code_sequence.go`

```go
package models

type OrderCodeSequence struct {
    DateKey      string `gorm:"column:date_key;primaryKey;type:varchar(6)"`
    LastSequence int    `gorm:"column:last_sequence;not null;default:0"`
}

func (OrderCodeSequence) TableName() string { return "order_code_sequences" }
```

### 3. Create Sequence Repository
**File:** `backend/src/internal/repositories/order_code_repo.go`

Interface:
```go
type OrderCodeRepository interface {
    GenerateOrderCode(ctx context.Context, tx *gorm.DB) (string, error)
}
```

Implementation:
1. Get current date as YYMMDD
2. UPSERT sequence row with row lock (FOR UPDATE)
3. Increment last_sequence
4. Format: `ROL-{dateKey}-{seq:03d}`
5. Return generated code

Key SQL pattern:
```sql
INSERT INTO order_code_sequences (date_key, last_sequence) 
VALUES ($1, 1)
ON CONFLICT (date_key) DO UPDATE SET last_sequence = order_code_sequences.last_sequence + 1
RETURNING last_sequence;
```

### 4. Update DTO
**File:** `backend/src/internal/dto/order_dto.go`

Add to OrderDTO struct:
```go
OrderCode string `json:"order_code"`
```

Update ToOrderDTO function:
```go
OrderCode: func() string {
    if o.OrderCode != nil {
        return *o.OrderCode
    }
    return ""
}(),
```

## Todo
- [ ] Add OrderCode field to Order model
- [ ] Create OrderCodeSequence model
- [ ] Create OrderCodeRepository interface + implementation
- [ ] Update OrderDTO struct
- [ ] Update ToOrderDTO function
- [ ] Run `go build` to verify no compile errors

## Notes
- OrderCode is pointer (*string) to allow NULL for existing orders during migration
- Repository uses UPSERT pattern for atomic sequence increment
- Transaction context passed to ensure same TX as order creation

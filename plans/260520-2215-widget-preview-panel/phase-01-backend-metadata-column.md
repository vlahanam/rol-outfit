---
phase: 1
title: Backend – Add metadata JSONB Column
status: completed
priority: high
effort: 30min
---

# Phase 01 – Backend: metadata Column

## Overview

Add `metadata JSONB` column to `widgets` table and thread it through all backend layers. No business logic — just pass-through like `settings`.

## Related Code Files

**Modify:**
- `backend/src/internal/models/widget.go`
- `backend/src/internal/dto/widget_dto.go`
- `backend/src/internal/requests/widget_request.go`
- `backend/src/internal/services/widget_service.go`

**Create:**
- `backend/database/migrations/000015_add_metadata_to_widgets.up.sql`
- `backend/database/migrations/000015_add_metadata_to_widgets.down.sql`

## metadata Schema per Widget Type

```jsonc
// banner-slider
{ "slides": [{ "title": "", "description": "", "button_text": "", "button_link": "", "image_url": "" }] }

// image-scroll-list
{ "images": [{ "image_url": "", "title": "", "description": "", "link": "" }] }

// two-large-images
{ "images": [{ "image_url": "", "title": "", "description": "", "link": "" }] } // exactly 2

// one-large-two-small
{ "images": [{ "image_url": "", "title": "", "description": "", "link": "" }] } // [0]=large, [1][2]=small

// slider-and-large-image
{
  "slides": [{ "title": "", "description": "", "button_text": "", "image_url": "" }],
  "image": { "image_url": "", "title": "", "description": "", "link": "" }
}
```

## Implementation Steps

### Step 1 – Migration files

**`000015_add_metadata_to_widgets.up.sql`:**
```sql
ALTER TABLE widgets
  ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN widgets.metadata IS 'Nội dung thực tế của widget: ảnh, tiêu đề, mô tả, liên kết';
```

**`000015_add_metadata_to_widgets.down.sql`:**
```sql
ALTER TABLE widgets DROP COLUMN IF EXISTS metadata;
```

### Step 2 – model/widget.go

Add after `Settings` field:
```go
Metadata json.RawMessage `gorm:"column:metadata;type:jsonb"`
```

### Step 3 – dto/widget_dto.go

Add to `WidgetDTO` struct:
```go
Metadata json.RawMessage `json:"metadata"`
```

Add to `ToWidgetDTO()` mapping:
```go
Metadata: w.Metadata,
```

### Step 4 – requests/widget_request.go

Add to `CreateWidgetRequest`:
```go
Metadata json.RawMessage `json:"metadata"`
```

Add to `UpdateWidgetRequest`:
```go
Metadata json.RawMessage `json:"metadata"`
```

No validation needed — JSONB is opaque at the request layer.

### Step 5 – services/widget_service.go

In `Create()`, add `Metadata` to widget construction:
```go
w := &models.Widget{
    // ...existing fields...
    Settings: req.Settings,
    Metadata: req.Metadata,  // add this line
}
```

In `Update()`, add metadata to dynamic fields map after the Settings block:
```go
if req.Metadata != nil {
    fields["metadata"] = req.Metadata
}
```

### Step 6 – Run migration

```bash
# From docker environment
make backend-shell
# Then inside container:
migrate -path /app/database/migrations -database "$DATABASE_URL" up
```

Or run directly via psql:
```bash
make db-shell
\i /path/to/000015_add_metadata_to_widgets.up.sql
```

### Step 7 – Compile check

```bash
cd backend && go build ./src/cmd/main.go
```

## Todo List

- [x] Create `000015_add_metadata_to_widgets.up.sql`
- [x] Create `000015_add_metadata_to_widgets.down.sql`
- [x] Add `Metadata json.RawMessage` to `Widget` model struct
- [x] Add `Metadata` to `WidgetDTO` + `ToWidgetDTO()`
- [x] Add `Metadata` to `CreateWidgetRequest` + `UpdateWidgetRequest`
- [x] Add `Metadata` pass-through in `widget_service.go` Create + Update
- [x] Run migration against DB
- [x] `go build` compiles with no errors

## Success Criteria

- `go build ./src/cmd/main.go` exits 0
- `\d widgets` in psql shows `metadata jsonb` column
- `POST /api/v1/widgets` with metadata payload returns it in response
- `PUT /api/v1/widgets/:id` with metadata updates it correctly

## Risk Assessment

- **Low risk** — pure pass-through, no logic change
- Migration is additive (non-breaking), column has DEFAULT so existing rows unaffected

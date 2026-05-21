---
title: Widget Type Preview Panel with Live Preview & metadata Column
status: completed
priority: high
created: 2026-05-20
completed: 2026-05-20
planDir: plans/260520-2215-widget-preview-panel
blockedBy: []
blocks: []
---

# Widget Type Preview Panel

Live preview panel on add/edit widget pages + `metadata` JSONB column for content storage.

## Overview

| # | Phase | Status | Est. |
|---|-------|--------|------|
| 1 | [Backend – metadata column](phase-01-backend-metadata-column.md) | completed | 30 min |
| 2 | [Frontend – new components](phase-02-frontend-components.md) | completed | 90 min |
| 3 | [Wire into add/edit pages](phase-03-wire-pages.md) | completed | 30 min |

## Key Dependencies

- `ImageUploader` component — already exists at `frontend/components/admin/image-uploader.tsx`
- Upload endpoint — `POST /api/v1/uploads` already implemented
- Next migration number — `000015`

## Scope

**Backend (6 file touches):**
- `backend/database/migrations/000015_add_metadata_to_widgets.{up,down}.sql` (NEW)
- `backend/src/internal/models/widget.go`
- `backend/src/internal/dto/widget_dto.go`
- `backend/src/internal/requests/widget_request.go`
- `backend/src/internal/services/widget_service.go`

**Frontend (5 file touches):**
- `frontend/types/api.ts`
- `frontend/components/admin/widgets/widget-metadata-form.tsx` (NEW)
- `frontend/components/admin/widgets/widget-type-preview.tsx` (NEW)
- `frontend/app/admin/(protected)/widgets/add/page.tsx`
- `frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx`

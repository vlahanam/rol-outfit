# Widgets

Dashboard widget system for configurable UI components.

### List Widgets
**GET** `/widgets`

Retrieve all widgets.

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "widget-001",
      "parent_id": null,
      "name": "Dashboard Stats",
      "type": "stat",
      "display_order": 1,
      "depth": 0,
      "status": 1,
      "settings": {"metric": "revenue", "timerange": "month"},
      "created_at": "2026-05-01T10:00:00Z",
      "updated_at": "2026-05-01T10:00:00Z"
    }
  ]
}
```

---

### Get Widget
**GET** `/widgets/:id`

Retrieve a single widget by ID.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Widget ID |

**Response (200 OK):**
```json
{
  "id": "widget-001",
  "parent_id": null,
  "name": "Dashboard Stats",
  "type": "stat",
  "display_order": 1,
  "depth": 0,
  "status": 1,
  "settings": {"metric": "revenue", "timerange": "month"},
  "created_at": "2026-05-01T10:00:00Z",
  "updated_at": "2026-05-01T10:00:00Z"
}
```

**Errors:**
- `404 Not Found` — Widget does not exist

---

### Create Widget
**POST** `/widgets`

Create a new widget. **Requires Admin role.**

**Authentication:** Bearer token required

**Request Body:**
```json
{
  "parent_id": null,
  "name": "Sales Chart",
  "type": "chart",
  "display_order": 2,
  "status": 1,
  "settings": {"chart_type": "line", "data_source": "sales"}
}
```

Valid widget types: `container`, `chart`, `table`, `stat`, `text`, `image`

**Response (201 Created):**
```json
{
  "id": "widget-002",
  "parent_id": null,
  "name": "Sales Chart",
  "type": "chart",
  "display_order": 2,
  "depth": 0,
  "status": 1,
  "settings": {"chart_type": "line", "data_source": "sales"},
  "created_at": "2026-05-01T14:00:00Z",
  "updated_at": "2026-05-01T14:00:00Z"
}
```

**Errors:**
- `400 Bad Request` — Invalid input (invalid type, name too short/long, invalid display_order, invalid status)
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin

---

### Update Widget
**PUT** `/widgets/:id`

Update a widget. **Requires Admin role.**

**Authentication:** Bearer token required

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Sales Chart",
  "type": "table",
  "display_order": 3,
  "status": 2,
  "settings": {"chart_type": "bar"}
}
```

**Response (200 OK):**
```json
{
  "id": "widget-002",
  "parent_id": null,
  "name": "Updated Sales Chart",
  "type": "table",
  "display_order": 3,
  "depth": 0,
  "status": 2,
  "settings": {"chart_type": "bar"},
  "created_at": "2026-05-01T14:00:00Z",
  "updated_at": "2026-05-01T15:30:00Z"
}
```

**Errors:**
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — Widget does not exist

---

### Delete Widget
**DELETE** `/widgets/:id`

Delete a widget. **Requires Admin role.**

**Authentication:** Bearer token required

**Response (204 No Content)**

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — Widget does not exist

---

## Widget Types

### Stat
Display a single metric/statistic.
```json
{
  "type": "stat",
  "settings": {
    "metric": "revenue",
    "timerange": "month",
    "format": "currency"
  }
}
```

### Chart
Display data as a chart (line, bar, pie).
```json
{
  "type": "chart",
  "settings": {
    "chart_type": "line",
    "data_source": "sales",
    "time_period": "7days"
  }
}
```

### Table
Display data in a table format.
```json
{
  "type": "table",
  "settings": {
    "data_source": "orders",
    "columns": ["id", "status", "amount"]
  }
}
```

### Container
Group other widgets.
```json
{
  "type": "container",
  "settings": {
    "layout": "grid",
    "columns": 2
  }
}
```

### Text
Display static text or markdown.
```json
{
  "type": "text",
  "settings": {
    "content": "# Dashboard Overview",
    "format": "markdown"
  }
}
```

### Image
Display an image.
```json
{
  "type": "image",
  "settings": {
    "src": "/uploads/image.jpg",
    "alt": "Dashboard image"
  }
}
```

---

## Hierarchical Widgets

Create nested widget layouts using `parent_id`:

```json
{
  "name": "Main Container",
  "type": "container",
  "parent_id": null
}
```

Then create children:

```json
{
  "name": "Revenue Stat",
  "type": "stat",
  "parent_id": "widget-001"
}
```

The `depth` field is automatically calculated to track nesting level (0 = root, 1 = child, etc.).

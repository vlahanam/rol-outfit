# Phase 6: Edit Page Integration

**Status:** completed  
**Effort:** 30m  
**Priority:** high

## Overview

Integrate TrendHotPreview, TrendHotEditor, and FullPagePreviewModal into the widget edit page.

## Files to Modify

| File | Changes |
|------|---------|
| `frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx` | +50 lines |

## Implementation

### 1. Add Imports

```typescript
import { TrendHotEditor, defaultTrendHotItem } from "@/components/admin/widgets/trend-hot-editor";
import { TrendHotPreview } from "@/components/admin/widgets/trend-hot-preview";
import { FullPagePreviewModal } from "@/components/admin/widgets/full-page-preview-modal";
import type { TrendHotSettings } from "@/types/api";
```

### 2. Add State

After existing state declarations:

```typescript
// Trend Hot state
const [trendHotItems, setTrendHotItems] = useState<CollectionItem[]>([defaultTrendHotItem()]);
const [activeTrendHotItem, setActiveTrendHotItem] = useState(0);
const [trendHotCardHeight, setTrendHotCardHeight] = useState(400);
const [showTrendHotBadge, setShowTrendHotBadge] = useState(false);
const [showFullPreview, setShowFullPreview] = useState(false);
```

### 3. Load Data in useEffect

In the `.then((res) => { ... })` block, add:

```typescript
if (w.type === "trend-hot") {
  const meta = w.metadata as { items?: CollectionItem[] } | null;
  const existing = meta?.items;
  setTrendHotItems(
    Array.isArray(existing) && existing.length > 0
      ? existing.map((it) => ({ ...defaultTrendHotItem(), ...it }))
      : [defaultTrendHotItem()]
  );
  const settings = w.settings as TrendHotSettings | null;
  if (settings?.cardHeight) setTrendHotCardHeight(settings.cardHeight);
  if (settings?.showBadge !== undefined) setShowTrendHotBadge(settings.showBadge);
}
```

### 4. Add Validation in handleSubmit

```typescript
if (form.type === "trend-hot") {
  const missingIdx = trendHotItems.findIndex((it) => !it.image);
  if (missingIdx !== -1) {
    setActiveTrendHotItem(missingIdx);
    setError(`Item ${missingIdx + 1} chưa có ảnh`);
    return;
  }
}
```

### 5. Add Payload in handleSubmit

```typescript
if (form.type === "trend-hot") {
  payload.metadata = { items: trendHotItems };
  payload.settings = { cardHeight: trendHotCardHeight, showBadge: showTrendHotBadge };
}
```

### 6. Add UI Section

After collection-grid section, add:

```tsx
{form.type === "trend-hot" && (
  <div className="space-y-6">
    {/* Settings */}
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Cài Đặt Hiển Thị</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Chiều cao card: {trendHotCardHeight}px
          </label>
          <Slider
            value={[trendHotCardHeight]}
            onValueChange={(vals) => vals[0] !== undefined && setTrendHotCardHeight(vals[0])}
            min={200}
            max={600}
            step={20}
            className="w-full max-w-xs"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showTrendHotBadge}
            onChange={(e) => setShowTrendHotBadge(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Hiển thị badge "HOT"</span>
        </label>
      </div>
    </div>

    {/* Preview */}
    <TrendHotPreview
      items={trendHotItems}
      activeIndex={activeTrendHotItem}
      onActiveChange={setActiveTrendHotItem}
      cardHeight={trendHotCardHeight}
      showBadge={showTrendHotBadge}
      onFullPreview={() => setShowFullPreview(true)}
    />

    {/* Editor */}
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 max-w-2xl">
      <h2 className="text-sm font-semibold text-gray-700">Nội Dung Items</h2>
      <TrendHotEditor
        items={trendHotItems}
        onChange={setTrendHotItems}
        activeIndex={activeTrendHotItem}
        onActiveChange={setActiveTrendHotItem}
      />
    </div>

    {/* Full Preview Modal */}
    <FullPagePreviewModal
      isOpen={showFullPreview}
      onClose={() => setShowFullPreview(false)}
      widgetType="trend-hot"
      data={{ items: trendHotItems, settings: { cardHeight: trendHotCardHeight, showBadge: showTrendHotBadge } }}
    />
  </div>
)}
```

## Todo

- [ ] Add imports
- [ ] Add state variables
- [ ] Load trend-hot data in useEffect
- [ ] Add validation in handleSubmit
- [ ] Add payload construction
- [ ] Add UI section
- [ ] Test full flow

## Success Criteria

- Trend-hot widget loads existing data
- Preview shows items in real-time
- Settings (cardHeight, badge) work
- Full preview modal opens/closes
- Save persists data correctly

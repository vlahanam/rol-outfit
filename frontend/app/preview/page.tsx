"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CollectionSlider } from "@/components/storefront/collection-slider";
import type { CollectionItem } from "@/types/api";

interface PreviewData {
  items: CollectionItem[];
  settings?: {
    cardHeight?: number;
    showBadge?: boolean;
  };
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const widgetType = searchParams.get("widget");
  const [data, setData] = useState<PreviewData | null>(null);

  useEffect(() => {
    window.parent.postMessage({ type: "preview-ready" }, window.location.origin);

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "preview-data") {
        setData(event.data.data);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Đang chờ dữ liệu...</p>
      </div>
    );
  }

  if (widgetType === "trend-hot") {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <CollectionSlider
          items={data.items}
          title="Xu Hướng Hot"
          cardHeight={data.settings?.cardHeight ?? 400}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-red-500 text-sm">Unknown widget type: {widgetType}</p>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  widgetType: string;
  data: {
    items: unknown[];
    settings?: Record<string, unknown>;
  };
}

export function FullPagePreviewModal({ isOpen, onClose, widgetType, data }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setLoading(true);
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "preview-ready") {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "preview-data", widgetType, data },
          window.location.origin
        );
        setLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isOpen, widgetType, data]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        title="Đóng (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-white text-sm">Đang tải preview...</div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={`/preview?widget=${widgetType}`}
        className="w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-lg"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

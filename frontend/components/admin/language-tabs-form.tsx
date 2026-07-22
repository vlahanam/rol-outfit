"use client";

import { useState } from "react";

interface LanguageTabsFormProps {
  defaultTab?: "vi" | "ja";
  viContent: React.ReactNode;
  jaContent: React.ReactNode;
}

export function LanguageTabsForm({
  defaultTab = "vi",
  viContent,
  jaContent,
}: LanguageTabsFormProps) {
  const [activeTab, setActiveTab] = useState<"vi" | "ja">(defaultTab);

  return (
    <div>
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("vi")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === "vi"
              ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          VI
          <span className="ml-1 text-xs text-red-500">*</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ja")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === "ja"
              ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          JA
        </button>
      </div>
      <div className={activeTab === "vi" ? "block" : "hidden"}>{viContent}</div>
      <div className={activeTab === "ja" ? "block" : "hidden"}>{jaContent}</div>
    </div>
  );
}

"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type Props = {
  children: ReactNode;
};

export default function AdminLayout({ children }: Props) {
  const [messages, setMessages] = useState<Record<string, unknown> | null>(null);
  const locale = "vn";

  useEffect(() => {
    import(`@/messages/${locale}.json`).then((mod) => {
      setMessages(mod.default);
    });
  }, []);

  if (!messages) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

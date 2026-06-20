'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type { SocialLinks } from '@/lib/api-resources';

export function SocialFloatingIcons() {
  const [links, setLinks] = useState<SocialLinks | null>(null);

  useEffect(() => {
    api
      .get<ApiResponse<SocialLinks>>('/settings/social-links')
      .then((res) => setLinks(res.data))
      .catch(() => setLinks(null));
  }, []);

  if (!links || (!links.facebook_url && !links.zalo_url)) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      {links.zalo_url && (
        <a
          href={links.zalo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0068FF] text-white shadow-lg animate-shake hover:animate-none hover:scale-110"
          aria-label="Zalo"
        >
          <svg viewBox="0 0 48 48" className="h-7 w-7" fill="currentColor">
            <path d="M24 4C12.95 4 4 12.95 4 24c0 11.05 8.95 20 20 20s20-8.95 20-20C44 12.95 35.05 4 24 4zm8.03 28.25c-.15.35-.55.65-1.1.65H17.25c-.8 0-1.25-.55-1.25-1.2 0-.35.15-.7.4-.95l10.5-12.1H17.5c-.65 0-1.15-.5-1.15-1.15s.5-1.15 1.15-1.15h12.75c.85 0 1.35.6 1.35 1.25 0 .35-.15.65-.35.9L20.9 30.55h11.05c.55 0 1.05.5 1.05 1.05 0 .25-.1.45-.25.65h.28z" />
          </svg>
        </a>
      )}
      {links.facebook_url && (
        <a
          href={links.facebook_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-lg animate-shake hover:animate-none hover:scale-110"
          aria-label="Facebook"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </a>
      )}
    </div>
  );
}

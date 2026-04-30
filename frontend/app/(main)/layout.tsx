import { MainLayout } from '@/components/MainLayout';
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}

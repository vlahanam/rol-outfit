import { AdminLayoutWrapper } from '@/components/admin/AdminLayoutWrapper';
import type { ReactNode } from 'react';

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}

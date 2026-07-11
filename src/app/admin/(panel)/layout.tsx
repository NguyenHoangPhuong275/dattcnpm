import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import AdminSidebar from '@/components/admin/AdminSidebar';
import { authCookieName, getAuthUserFromToken } from '@/lib/auth';
import { adminCookieName, verifyAdminSession } from '@/lib/admin-auth';
import { ROUTES } from '@/lib/constants';

type AdminLayoutProps = {
  children: ReactNode;
};

// Layout này chỉ bọc nhóm (panel) — trang /admin/login nằm ngoài nhóm nên không bị chặn.
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  const user = token ? await getAuthUserFromToken(token) : null;
  const isEnvironmentAdmin = await verifyAdminSession(cookieStore.get(adminCookieName)?.value);

  if (!user && !isEnvironmentAdmin) {
    redirect(`${ROUTES.admin}/login`);
  }

  if (user && user.role !== 'ADMIN' && !isEnvironmentAdmin) {
    redirect(ROUTES.home);
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="flex flex-col lg:flex-row">
        <AdminSidebar />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}

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

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  const user = token ? await getAuthUserFromToken(token) : null;
  const isEnvironmentAdmin = await verifyAdminSession(cookieStore.get(adminCookieName)?.value);

  if (!user && !isEnvironmentAdmin) {
    redirect(ROUTES.adminLogin);
  }

  if (user && user.role !== 'ADMIN' && !isEnvironmentAdmin) {
    redirect(ROUTES.home);
  }

  return (
    <div className="admin-brand min-h-screen bg-[var(--admin-brand-canvas)]">
      <div className="flex flex-col lg:flex-row">
        <AdminSidebar />
        <main className="min-w-0 flex-1 p-5 sm:p-8 lg:min-h-screen lg:p-10 xl:p-12">
          <div className="mx-auto w-full max-w-[1480px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import AdminAlert from '@/components/admin/AdminAlert';
import UserManagement, { type AdminUserItem } from '@/components/admin/UserManagement';
import { useAdminWebhook } from '@/hooks/useAdminWebhook';
import { getApiErrorMessage } from '@/lib/api-client';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UsersPayload {
  users?: AdminUserItem[];
  pagination?: Pagination;
  message?: string;
}

export default function AdminUsersPage(): React.JSX.Element {
  const router = useRouter();
  const { alert, triggerAlert, request } = useAdminWebhook();

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { response, data } = await request<UsersPayload>('system.users', {
        page,
        limit: 10,
        query,
        status,
      });
      if (!response.ok) throw new Error(getApiErrorMessage(data, 'Không thể tải danh sách người dùng'));
      setUsers(data.users || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (error: unknown) {
      triggerAlert(error instanceof Error ? error.message : 'Lỗi tải người dùng', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [request, triggerAlert, page, query, status]);

  useEffect(() => {
    const timeout = setTimeout(fetchUsers, 250);
    return () => clearTimeout(timeout);
  }, [fetchUsers]);

  const handleAction = async (actionId: string, event: string, payload?: Record<string, unknown>) => {
    setActionLoading(actionId);
    try {
      const { response, data } = await request<{ message?: string }>(event, payload);
      if (!response.ok) throw new Error(getApiErrorMessage(data, 'Thao tác thất bại'));
      triggerAlert(data.message || 'Thao tác thành công', 'success');
      fetchUsers();
    } catch (err: unknown) {
      triggerAlert(err instanceof Error ? err.message : 'Đã xảy ra lỗi', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-text)]">Người dùng</h1>
        <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">
          Tìm kiếm, khóa/mở khóa, xóa tài khoản và xem hoạt động của từng người dùng
        </p>
      </div>

      <AdminAlert alert={alert} />

      <UserManagement
        users={users}
        query={query}
        status={status}
        page={page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        isLoading={isLoading}
        actionLoading={actionLoading}
        onQueryChange={(value) => { setQuery(value); setPage(1); }}
        onStatusChange={(value) => { setStatus(value); setPage(1); }}
        onPageChange={setPage}
        onAction={handleAction}
        onViewActivity={(user) => {
          const label = `${user.fullName} (${user.email})`;
          router.push(`/admin/logs?userId=${encodeURIComponent(String(user._id))}&label=${encodeURIComponent(label)}`);
        }}
      />
    </div>
  );
}

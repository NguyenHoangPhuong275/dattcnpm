'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import AdminAlert from '@/components/admin/AdminAlert';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
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
      triggerAlert(error instanceof Error ? error.message : 'Không thể tải danh sách người dùng', 'error');
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
      if (!response.ok) throw new Error(getApiErrorMessage(data, 'Không thể cập nhật tài khoản'));
      triggerAlert(data.message || 'Đã cập nhật tài khoản', 'success');
      fetchUsers();
    } catch (err: unknown) {
      triggerAlert(err instanceof Error ? err.message : 'Không thể hoàn tất yêu cầu', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Người dùng"
        description="Tra cứu tài khoản, kiểm soát trạng thái truy cập và xem lại lịch sử hoạt động khi cần hỗ trợ."
      />

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

'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import AdminAlert from '@/components/admin/AdminAlert';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AuditLogViewer, { type AdminAuditLog } from '@/components/admin/AuditLogViewer';
import { useAdminWebhook } from '@/hooks/useAdminWebhook';
import { getApiErrorMessage } from '@/lib/api-client';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface LogsPayload {
  logs?: AdminAuditLog[];
  pagination?: Pagination;
  message?: string;
}

export default function AdminLogsPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <AdminLogsContent />
    </Suspense>
  );
}

function AdminLogsContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actorUserId = searchParams.get('userId');
  const actorLabel = searchParams.get('label');

  const { alert, triggerAlert, request } = useAdminWebhook();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [actionFilter, setActionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { response, data } = await request<LogsPayload>('system.logs', {
        page,
        limit: 15,
        action: actionFilter || undefined,
        userId: actorUserId || undefined,
      });
      if (!response.ok) throw new Error(getApiErrorMessage(data, 'Không thể tải nhật ký'));
      setLogs(data.logs || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (err: unknown) {
      triggerAlert(err instanceof Error ? err.message : 'Lỗi tải nhật ký', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [request, triggerAlert, page, actionFilter, actorUserId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Nhật ký hoạt động"
        description="Theo dõi các sự kiện quan trọng, xác định người thực hiện và hỗ trợ đối soát khi có phát sinh."
      />

      <AdminAlert alert={alert} />

      <AuditLogViewer
        logs={logs}
        isLoading={isLoading}
        page={page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        actionFilter={actionFilter}
        selectedUserLabel={actorUserId ? (actorLabel ?? 'Người dùng đã chọn') : undefined}
        onActionFilterChange={(value) => { setActionFilter(value); setPage(1); }}
        onPageChange={setPage}
        onClearUser={() => { setPage(1); router.replace('/admin/logs'); }}
        onRefresh={fetchLogs}
      />
    </div>
  );
}

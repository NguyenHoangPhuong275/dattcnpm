'use client';

import { useState } from 'react';

import AdminAlert from '@/components/admin/AdminAlert';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import DatabaseActions from '@/components/admin/DatabaseActions';
import { useAdminWebhook } from '@/hooks/useAdminWebhook';
import { useConfirm } from '@/hooks/useConfirm';
import { getApiErrorMessage } from '@/lib/api-client';

interface DbActionPayload {
  message?: string;
  report?: {
    isClean?: boolean;
  };
}

export default function AdminDatabasePage(): React.JSX.Element {
  const { confirm } = useConfirm();
  const { alert, triggerAlert, request } = useAdminWebhook();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const runDbAction = async (event: string, payload?: Record<string, unknown>) => {
    setActionLoading(event);
    try {
      const { response, data } = await request<DbActionPayload>(event, payload);
      if (!response.ok) throw new Error(getApiErrorMessage(data, 'Thao tác thất bại'));

      if (event === 'db.check') {
        triggerAlert(data.message || 'Đã hoàn tất kiểm tra dữ liệu', data.report?.isClean ? 'success' : 'error');
      } else {
        triggerAlert(data.message || 'Thao tác thành công', 'success');
      }
    } catch (err: unknown) {
      triggerAlert(err instanceof Error ? err.message : 'Đã xảy ra lỗi', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDbAction = async (action: 'db.reset' | 'db.clear') => {
    const text = action === 'db.reset'
      ? 'Hành động này sẽ xóa vĩnh viễn toàn bộ tài khoản, chuyến đi, nội dung và thông tin đặt chỗ của người dùng. Hệ thống sẽ tự động khởi tạo lại cấu trúc ban đầu.'
      : 'Hành động này sẽ xóa sạch hoàn toàn cơ sở dữ liệu. Tất cả thông tin sẽ biến mất vĩnh viễn và không thể khôi phục.';

    const confirmed = await confirm({
      title: action === 'db.reset' ? 'Đặt lại dữ liệu hệ thống?' : 'Xóa sạch cơ sở dữ liệu?',
      description: text,
      confirmLabel: action === 'db.reset' ? 'Xóa dữ liệu' : 'Xóa sạch',
      tone: 'danger',
    });

    if (confirmed) {
      runDbAction(action, { confirm: true });
    }
  };

  const handleDbAction = (action: 'db.reset' | 'db.clear' | 'db.check' | 'db.createTables') => {
    if (action === 'db.check' || action === 'db.createTables') {
      runDbAction(action);
    } else {
      confirmDbAction(action);
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Bảo trì hệ thống"
        description="Kiểm tra dữ liệu và khôi phục các thành phần còn thiếu. Hãy sao lưu trước khi thực hiện thao tác xóa."
      />

      <AdminAlert alert={alert} />

      <DatabaseActions onDbAction={handleDbAction} actionLoading={actionLoading} />
    </div>
  );
}

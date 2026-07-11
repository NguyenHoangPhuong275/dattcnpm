'use client';

import { useState } from 'react';

import AdminAlert from '@/components/admin/AdminAlert';
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
  const [secret, setSecret] = useState('');

  const runDbAction = async (event: string, payload?: Record<string, unknown>) => {
    setActionLoading(event);
    try {
      const { response, data } = await request<DbActionPayload>(event, payload, secret || undefined);
      if (!response.ok) throw new Error(getApiErrorMessage(data, 'Thao tác thất bại'));

      if (event === 'db.check') {
        triggerAlert(data.message || 'Đã kiểm tra DB', data.report?.isClean ? 'success' : 'error');
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
      ? 'Bạn có chắc chắn muốn RESET Database về trạng thái mẫu ban đầu? (sẽ drop toàn bộ collections managed)'
      : 'CẢNH BÁO: Hành động này sẽ DROP toàn bộ collections (xóa sạch duplicates + data + indexes). Bạn có chắc không?';

    const confirmed = await confirm({
      title: action === 'db.reset' ? 'Reset database?' : 'Xóa sạch database?',
      description: text,
      confirmLabel: action === 'db.reset' ? 'Reset' : 'Xóa sạch',
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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-text)]">Cơ sở dữ liệu</h1>
        <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">
          Kiểm tra tính nhất quán, tạo bảng và các tác vụ bảo trì nguy hiểm
        </p>
      </div>

      <AdminAlert alert={alert} />

      <DatabaseActions onDbAction={handleDbAction} actionLoading={actionLoading} />

      <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-[var(--color-text)]">
          <svg className="h-5 w-5 text-[var(--color-primary-darker)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Webhook Token (tùy chọn)
        </h2>
        <p className="mb-3 text-xs text-[var(--color-text-muted)]">
          Trang này dùng phiên quản trị hiện tại nên không cần token. Chỉ nhập x-webhook-secret khi muốn gọi thay bằng secret.
          Token giữ trong bộ nhớ phiên, không lưu vào Browser Storage.
        </p>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value.trim())}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/70 px-4 py-3 text-sm font-medium text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-dark)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary-lightest)]"
          placeholder="x-webhook-secret (bỏ trống nếu đã đăng nhập quản trị)..."
        />
      </div>
    </div>
  );
}

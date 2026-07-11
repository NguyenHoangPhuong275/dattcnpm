'use client';

import AdminAlert from '@/components/admin/AdminAlert';
import ReviewReportsPanel from '@/components/admin/ReviewReportsPanel';
import { useAdminWebhook } from '@/hooks/useAdminWebhook';

export default function AdminReportsPage(): React.JSX.Element {
  const { alert, triggerAlert } = useAdminWebhook();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-text)]">Report đánh giá</h1>
        <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">
          Xem xét các báo cáo đánh giá vi phạm và đánh dấu đã xử lý hoặc bỏ qua
        </p>
      </div>

      <AdminAlert alert={alert} />

      <ReviewReportsPanel onNotify={triggerAlert} />
    </div>
  );
}

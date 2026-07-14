'use client';

import AdminAlert from '@/components/admin/AdminAlert';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ReviewReportsPanel from '@/components/admin/ReviewReportsPanel';
import { useAdminWebhook } from '@/hooks/useAdminWebhook';

export default function AdminReportsPage(): React.JSX.Element {
  const { alert, triggerAlert } = useAdminWebhook();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Báo cáo đánh giá"
        description="Xem xét phản ánh từ cộng đồng và ghi nhận kết quả xử lý minh bạch, nhất quán."
      />

      <AdminAlert alert={alert} />

      <ReviewReportsPanel onNotify={triggerAlert} />
    </div>
  );
}

'use client';

import AdminAlert from '@/components/admin/AdminAlert';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import HotelBookingsPanel from '@/components/admin/HotelBookingsPanel';
import { useAdminWebhook } from '@/hooks/useAdminWebhook';

export default function AdminBookingsPage(): React.JSX.Element {
  const { alert, triggerAlert } = useAdminWebhook();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Yêu cầu đặt chỗ"
        description="Tiếp nhận và xử lý yêu cầu đặt phòng khách sạn và vé máy bay của khách hàng."
      />

      <AdminAlert alert={alert} />

      <HotelBookingsPanel onNotify={triggerAlert} />
    </div>
  );
}

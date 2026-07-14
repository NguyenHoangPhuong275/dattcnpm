'use client';

import { useState } from 'react';

import AdminAlert from '@/components/admin/AdminAlert';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import BroadcastForm from '@/components/admin/BroadcastForm';
import { useAdminWebhook } from '@/hooks/useAdminWebhook';
import { getApiErrorMessage } from '@/lib/api-client';

export default function AdminNotificationsPage(): React.JSX.Element {
  const { alert, triggerAlert, request } = useAdminWebhook();

  const [notifTitle, setNotifTitle] = useState('Thông báo hệ thống');
  const [notifContent, setNotifContent] = useState('');
  const [notifType, setNotifType] = useState('SYSTEM');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifContent.trim()) {
      triggerAlert('Vui lòng điền nội dung thông báo', 'error');
      return;
    }
    setActionLoading('broadcast');
    try {
      const { response, data } = await request<{ message?: string }>('notification.broadcast', {
        title: notifTitle,
        content: notifContent,
        type: notifType,
      });
      if (!response.ok) throw new Error(getApiErrorMessage(data, 'Không thể gửi thông báo'));
      triggerAlert(data.message || 'Đã gửi thông báo', 'success');
      setNotifContent('');
    } catch (err: unknown) {
      triggerAlert(err instanceof Error ? err.message : 'Không thể gửi thông báo. Vui lòng thử lại.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Gửi thông báo"
        description="Soạn và gửi thông báo quan trọng đến toàn bộ người dùng đang hoạt động trên Lotus Travel."
      />

      <AdminAlert alert={alert} />

      <BroadcastForm
        notifTitle={notifTitle}
        notifContent={notifContent}
        notifType={notifType}
        onTitleChange={setNotifTitle}
        onContentChange={setNotifContent}
        onTypeChange={setNotifType}
        onSubmit={handleBroadcast}
        actionLoading={actionLoading}
      />
    </div>
  );
}

'use client';

import type { FormEvent } from 'react';

interface BroadcastFormProps {
  notifTitle: string;
  notifContent: string;
  notifType: string;
  onTitleChange: (val: string) => void;
  onContentChange: (val: string) => void;
  onTypeChange: (val: string) => void;
  onSubmit: (e: FormEvent) => void;
  actionLoading: string | null;
}

const inputClassName = 'admin-field';

export default function BroadcastForm({
  notifTitle,
  notifContent,
  notifType,
  onTitleChange,
  onContentChange,
  onTypeChange,
  onSubmit,
  actionLoading,
}: BroadcastFormProps) {
  return (
    <form onSubmit={onSubmit} className="admin-surface overflow-hidden">
      <div className="border-b border-black/[0.055] px-6 py-5 sm:px-7">
        <h2 className="text-lg font-extrabold text-[var(--color-text)]">Soạn thông báo mới</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Thông báo được gửi ngay đến tất cả tài khoản đang hoạt động.</p>
      </div>

      <div className="space-y-5 p-6 sm:p-7">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="admin-notification-title" className="block text-xs font-bold text-[var(--color-text-secondary)]">Tiêu đề</label>
          <input
            id="admin-notification-title"
            type="text"
            value={notifTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className={inputClassName}
            placeholder="Ví dụ: Cập nhật dịch vụ"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="admin-notification-type" className="block text-xs font-bold text-[var(--color-text-secondary)]">Loại thông báo</label>
          <select
            id="admin-notification-type"
            value={notifType}
            onChange={(e) => onTypeChange(e.target.value)}
              className={`${inputClassName} app-select cursor-pointer`}
          >
            <option value="SYSTEM">Cập nhật dịch vụ</option>
            <option value="WEATHER_ALERT">Cảnh báo thời tiết</option>
            <option value="RECOMMENDATION">Gợi ý điểm đến</option>
            <option value="TRIP_SHARE">Chia sẻ chuyến đi</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="admin-notification-content" className="block text-xs font-bold text-[var(--color-text-secondary)]">Nội dung</label>
        <textarea
          id="admin-notification-content"
          value={notifContent}
          onChange={(e) => onContentChange(e.target.value)}
          rows={6}
          className={`${inputClassName} resize-none`}
          placeholder="Viết thông báo rõ ràng, ngắn gọn và hữu ích cho người nhận..."
        />
      </div>

      <button
        id="admin-notification-submit"
        type="submit"
        disabled={actionLoading !== null || !notifContent.trim()}
        className="admin-button-primary w-full sm:w-auto sm:min-w-44"
      >
        {actionLoading === 'broadcast' ? 'Đang gửi thông báo...' : 'Gửi đến tất cả người dùng'}
      </button>
      </div>
    </form>
  );
}

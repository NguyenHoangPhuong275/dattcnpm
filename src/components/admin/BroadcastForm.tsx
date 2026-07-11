'use client';

import React from 'react';

interface BroadcastFormProps {
  notifTitle: string;
  notifContent: string;
  notifType: string;
  onTitleChange: (val: string) => void;
  onContentChange: (val: string) => void;
  onTypeChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  actionLoading: string | null;
}

const inputClassName =
  'w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/70 px-4 py-2.5 text-sm font-medium text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-dark)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary-lightest)]';

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
    <form onSubmit={onSubmit} className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm space-y-4">
      <h2 className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3 text-lg font-extrabold text-[var(--color-text)]">
        <svg className="w-5 h-5 text-[var(--color-primary-darker)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Gửi thông báo hệ thống (Broadcast)
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block pl-1 text-xs font-semibold text-[var(--color-text-secondary)]">Tiêu đề</label>
          <input
            type="text"
            value={notifTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className={inputClassName}
            placeholder="Tiêu đề thông báo..."
          />
        </div>

        <div className="space-y-1">
          <label className="block pl-1 text-xs font-semibold text-[var(--color-text-secondary)]">Loại thông báo</label>
          <select
            value={notifType}
            onChange={(e) => onTypeChange(e.target.value)}
            className={`${inputClassName} cursor-pointer`}
          >
            <option value="SYSTEM">Hệ thống (SYSTEM)</option>
            <option value="WEATHER_ALERT">Thời tiết (WEATHER_ALERT)</option>
            <option value="RECOMMENDATION">Gợi ý địa điểm (RECOMMENDATION)</option>
            <option value="TRIP_SHARE">Chia sẻ chuyến đi (TRIP_SHARE)</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block pl-1 text-xs font-semibold text-[var(--color-text-secondary)]">Nội dung</label>
        <textarea
          value={notifContent}
          onChange={(e) => onContentChange(e.target.value)}
          rows={3}
          className={`${inputClassName} resize-none`}
          placeholder="Nhập nội dung thông báo gửi đến toàn bộ người dùng..."
        />
      </div>

      <button
        type="submit"
        disabled={actionLoading !== null || !notifContent.trim()}
        className="w-full rounded-full bg-[var(--color-primary-darker)] py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[var(--color-primary-dark)] cursor-pointer min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {actionLoading === 'broadcast' ? 'Đang gửi broadcast...' : 'Broadcast Thông báo'}
      </button>
    </form>
  );
}

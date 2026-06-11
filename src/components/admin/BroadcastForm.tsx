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
    <form onSubmit={onSubmit} className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-lg shadow-slate-950/35 space-y-4">
      <h2 className="text-lg font-bold text-indigo-300 flex items-center gap-2 border-b border-slate-800 pb-3">
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Gửi thông báo hệ thống (Broadcast)
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-400 pl-1">Tiêu đề</label>
          <input
            type="text"
            value={notifTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none text-sm cursor-text"
            placeholder="Tiêu đề thông báo..."
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-400 pl-1">Loại thông báo</label>
          <select
            value={notifType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-2.5 text-slate-100 focus:outline-none text-sm cursor-pointer"
          >
            <option value="SYSTEM">Hệ thống (SYSTEM)</option>
            <option value="WEATHER_ALERT">Thời tiết (WEATHER_ALERT)</option>
            <option value="RECOMMENDATION">Gợi ý địa điểm (RECOMMENDATION)</option>
            <option value="TRIP_SHARE">Chia sẻ chuyến đi (TRIP_SHARE)</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-semibold text-slate-400 pl-1">Nội dung</label>
        <textarea
          value={notifContent}
          onChange={(e) => onContentChange(e.target.value)}
          rows={3}
          className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none text-sm cursor-text resize-none"
          placeholder="Nhập nội dung thông báo gửi đến toàn bộ người dùng..."
        />
      </div>

      <button
        type="submit"
        disabled={actionLoading !== null || !notifContent.trim()}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all cursor-pointer min-h-[44px]"
      >
        {actionLoading === 'broadcast' ? 'Đang gửi broadcast...' : 'Broadcast Thông báo'}
      </button>
    </form>
  );
}

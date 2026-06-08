'use client';

import React from 'react';

interface UserManagementProps {
  userEmail: string;
  onUserEmailChange: (email: string) => void;
  onAction: (actionId: string, event: string, payload?: Record<string, unknown>) => void;
  actionLoading: string | null;
}

export default function UserManagement({
  userEmail,
  onUserEmailChange,
  onAction,
  actionLoading,
}: UserManagementProps) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-lg shadow-slate-950/35 space-y-6">
      <h2 className="text-lg font-bold text-indigo-300 flex items-center gap-2 border-b border-slate-800 pb-3">
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Quản lý Người dùng
      </h2>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-400 pl-1">Địa chỉ Email người dùng</label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => onUserEmailChange(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm cursor-text"
            placeholder="email@example.com"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <button
            onClick={() => onAction('lock', 'user.lock', { email: userEmail })}
            disabled={actionLoading !== null || !userEmail}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {actionLoading === 'lock' ? 'Đang xử lý...' : 'Khóa tài khoản'}
          </button>

          <button
            onClick={() => onAction('unlock', 'user.unlock', { email: userEmail })}
            disabled={actionLoading !== null || !userEmail}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {actionLoading === 'unlock' ? 'Đang xử lý...' : 'Mở khóa'}
          </button>

          <button
            onClick={() => onAction('softdelete', 'user.delete', { email: userEmail, hard: false })}
            disabled={actionLoading !== null || !userEmail}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {actionLoading === 'softdelete' ? 'Đang xử lý...' : 'Xóa mềm'}
          </button>

          <button
            onClick={() => {
              if (confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản ${userEmail}?`)) {
                onAction('harddelete', 'user.delete', { email: userEmail, hard: true });
              }
            }}
            disabled={actionLoading !== null || !userEmail}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {actionLoading === 'harddelete' ? 'Đang xử lý...' : 'Xóa vĩnh viễn'}
          </button>
        </div>
      </div>
    </div>
  );
}

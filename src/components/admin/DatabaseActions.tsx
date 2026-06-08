'use client';

import React from 'react';

interface DatabaseActionsProps {
  onDbAction: (action: 'db.reset' | 'db.clear' | 'db.check' | 'db.createTables') => void;
  actionLoading: string | null;
}

export default function DatabaseActions({ onDbAction, actionLoading }: DatabaseActionsProps) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-lg shadow-slate-950/35 space-y-4">
      <h2 className="text-lg font-bold text-rose-300 flex items-center gap-2 border-b border-slate-800 pb-3">
        <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Tác vụ Cơ sở dữ liệu
      </h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onDbAction('db.reset')}
          disabled={actionLoading !== null}
          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-2xl font-bold text-sm transition-all cursor-pointer min-h-[44px]"
        >
          {actionLoading === 'db.reset' ? 'Đang reset DB...' : 'Reset DB (Seed mẫu)'}
        </button>
        <button
          onClick={() => onDbAction('db.clear')}
          disabled={actionLoading !== null}
          className="flex-1 py-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 rounded-2xl font-bold text-sm transition-all cursor-pointer min-h-[44px]"
        >
          {actionLoading === 'db.clear' ? 'Đang xóa DB...' : 'Xóa trắng Database (drop collections + duplicates)'}
        </button>
        <button
          onClick={() => onDbAction('db.check')}
          disabled={actionLoading !== null}
          className="flex-1 py-3 bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl font-bold text-sm transition-all cursor-pointer min-h-[44px]"
        >
          {actionLoading === 'db.check' ? 'Đang kiểm tra...' : 'Check DB Consistency'}
        </button>
        <button
          onClick={() => onDbAction('db.createTables')}
          disabled={actionLoading !== null}
          className="flex-1 py-3 bg-sky-900/40 hover:bg-sky-800/60 text-sky-300 border border-sky-500/30 hover:border-sky-400/60 rounded-2xl font-bold text-sm transition-all cursor-pointer min-h-[44px]"
        >
          {actionLoading === 'db.createTables' ? 'Đang tạo bảng...' : 'Tạo tất cả bảng'}
        </button>
      </div>
    </div>
  );
}

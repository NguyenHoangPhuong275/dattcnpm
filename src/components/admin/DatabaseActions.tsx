'use client';

import React from 'react';

interface DatabaseActionsProps {
  onDbAction: (action: 'db.reset' | 'db.clear' | 'db.check' | 'db.createTables') => void;
  actionLoading: string | null;
}

export default function DatabaseActions({ onDbAction, actionLoading }: DatabaseActionsProps) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm space-y-4">
      <h2 className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3 text-lg font-extrabold text-[var(--color-text)]">
        <svg className="w-5 h-5 text-[var(--color-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Tác vụ Cơ sở dữ liệu
      </h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => onDbAction('db.reset')}
          disabled={actionLoading !== null}
          className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 text-sm font-bold text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-primary-lightest)] cursor-pointer min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {actionLoading === 'db.reset' ? 'Đang reset DB...' : 'Reset DB (Seed mẫu)'}
        </button>
        <button
          type="button"
          onClick={() => onDbAction('db.clear')}
          disabled={actionLoading !== null}
          className="flex-1 rounded-2xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 py-3 text-sm font-bold text-red-700 transition-all hover:bg-[var(--color-danger)]/20 cursor-pointer min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {actionLoading === 'db.clear' ? 'Đang xóa DB...' : 'Xóa trắng Database (drop collections + duplicates)'}
        </button>
        <button
          type="button"
          onClick={() => onDbAction('db.check')}
          disabled={actionLoading !== null}
          className="flex-1 rounded-2xl border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 py-3 text-sm font-bold text-emerald-700 transition-all hover:bg-[var(--color-success)]/20 cursor-pointer min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {actionLoading === 'db.check' ? 'Đang kiểm tra...' : 'Check DB Consistency'}
        </button>
        <button
          type="button"
          onClick={() => onDbAction('db.createTables')}
          disabled={actionLoading !== null}
          className="flex-1 rounded-2xl border border-[var(--color-primary)]/60 bg-[var(--color-primary-lightest)] py-3 text-sm font-bold text-[var(--color-primary-darker)] transition-all hover:bg-[var(--color-primary-light)] cursor-pointer min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {actionLoading === 'db.createTables' ? 'Đang tạo bảng...' : 'Tạo tất cả bảng'}
        </button>
      </div>
    </div>
  );
}

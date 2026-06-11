'use client';

import React from 'react';

interface PasswordChangeModalProps {
  open: boolean;
  oldPass: string;
  newPass: string;
  confirmPass: string;
  onClose: () => void;
  onOldChange: (v: string) => void;
  onNewChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
  onSubmit: () => void;
}

export default function PasswordChangeModal({
  open,
  oldPass,
  newPass,
  confirmPass,
  onClose,
  onOldChange,
  onNewChange,
  onConfirmChange,
  onSubmit
}: PasswordChangeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 border border-slate-200">
        <h3 className="font-semibold text-lg mb-4">Đổi mật khẩu</h3>
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Mật khẩu cũ"
            value={oldPass}
            onChange={(e) => onOldChange(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
          />
          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={newPass}
            onChange={(e) => onNewChange(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPass}
            onChange={(e) => onConfirmChange(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-slate-300 rounded-xl text-sm hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 py-2 bg-[var(--color-primary-dark)] text-white rounded-xl text-sm font-semibold"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

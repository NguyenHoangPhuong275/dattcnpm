'use client';

import React, { useState, useEffect } from 'react';

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
  saving?: boolean;
  serverError?: string | null;
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
  onSubmit,
  saving,
  serverError
}: PasswordChangeModalProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setLocalError(null);
  }, [open]);

  const handleSubmit = () => {
    setLocalError(null);
    if (!oldPass.trim()) {
      setLocalError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (newPass.length < 8) {
      setLocalError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    if (newPass !== confirmPass) {
      setLocalError('Mật khẩu xác nhận không khớp');
      return;
    }
    onSubmit();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 border border-slate-200">
        <h3 className="font-semibold text-lg mb-4">Đổi mật khẩu</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="pwd-current" className="mb-1 block text-xs font-semibold text-slate-600">
              Mật khẩu hiện tại
            </label>
            <input
              id="pwd-current"
              type="password"
              placeholder="Mật khẩu cũ"
              value={oldPass}
              onChange={(e) => onOldChange(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="pwd-new" className="mb-1 block text-xs font-semibold text-slate-600">
              Mật khẩu mới
            </label>
            <input
              id="pwd-new"
              type="password"
              placeholder="Mật khẩu mới"
              value={newPass}
              onChange={(e) => onNewChange(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="pwd-confirm" className="mb-1 block text-xs font-semibold text-slate-600">
              Xác nhận mật khẩu mới
            </label>
            <input
              id="pwd-confirm"
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPass}
              onChange={(e) => onConfirmChange(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>
        {(localError || serverError) && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {localError || serverError}
          </p>
        )}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-slate-300 rounded-xl text-sm hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2 bg-[var(--color-primary-dark)] text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
                Đang lưu...
              </>
            ) : 'Đổi mật khẩu'}
          </button>
        </div>
      </div>
    </div>
  );
}

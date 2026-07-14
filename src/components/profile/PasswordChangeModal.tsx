'use client';
import { useEffect, useState, type FormEvent } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="profile-password-modal-title" className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 id="profile-password-modal-title" className="font-semibold text-lg mb-4 text-[var(--color-text)]">Đổi mật khẩu</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label htmlFor="pwd-current" className="mb-1 block text-xs font-semibold text-[var(--color-text-secondary)]">
                Mật khẩu hiện tại
              </label>
              <input
                id="pwd-current"
                type="password"
                autoComplete="current-password"
                placeholder="Mật khẩu cũ"
                value={oldPass}
                onChange={(e) => onOldChange(e.target.value)}
                disabled={saving}
                className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-dark)] bg-white text-[var(--color-text)] disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="pwd-new" className="mb-1 block text-xs font-semibold text-[var(--color-text-secondary)]">
                Mật khẩu mới
              </label>
              <input
                id="pwd-new"
                type="password"
                autoComplete="new-password"
                placeholder="Mật khẩu mới"
                value={newPass}
                onChange={(e) => onNewChange(e.target.value)}
                disabled={saving}
                className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-dark)] bg-white text-[var(--color-text)] disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="pwd-confirm" className="mb-1 block text-xs font-semibold text-[var(--color-text-secondary)]">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="pwd-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPass}
                onChange={(e) => onConfirmChange(e.target.value)}
                disabled={saving}
                className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-dark)] bg-white text-[var(--color-text)] disabled:opacity-60"
              />
            </div>
          </div>
          {(localError || serverError) && (
            <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
              {localError || serverError}
            </p>
          )}
          <div className="flex gap-3 mt-6">
            <button
              id="profile-password-cancel"
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2 border border-[var(--color-border)] rounded-xl text-sm hover:bg-[var(--color-primary-lightest)] text-[var(--color-text-secondary)] transition disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              id="profile-password-submit"
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-[var(--color-primary-dark)] text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition hover:bg-[var(--color-primary-darker)]"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Đang lưu...
                </>
              ) : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

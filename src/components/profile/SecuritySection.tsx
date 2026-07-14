'use client';

import { memo } from 'react';

interface SecuritySectionProps {
  onChangePassword: () => void;
  saving?: boolean;
}

const SecuritySection = memo(({ onChangePassword, saving }: SecuritySectionProps) => (
  <div className="space-y-4">

    <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center">
      <div>
        <div className="font-semibold">Mật khẩu</div>
        <div className="text-xs text-[var(--color-text-muted)]">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản</div>
      </div>
      <button
        id="profile-change-password-button"
        type="button"
        onClick={onChangePassword}
        className="text-sm font-bold text-[var(--color-primary-dark)] bg-[var(--color-primary-dark)]/10 hover:bg-[var(--color-primary-dark)]/15 px-4 py-2 rounded-xl"
        disabled={saving}
      >
        Đổi mật khẩu
      </button>
    </div>
  </div>
));

SecuritySection.displayName = 'SecuritySection';

export default SecuritySection;

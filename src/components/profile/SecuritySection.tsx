'use client';

import React, { memo } from 'react';

interface SecuritySectionProps {
  is2FAEnabled: boolean;
  onToggle2FA: () => void;
  onChangePassword: () => void;
  saving?: boolean;
}

const SecuritySection = memo(({ is2FAEnabled, onToggle2FA, onChangePassword, saving }: SecuritySectionProps) => (
  <div className="space-y-4">
    <div className="text-lg font-display font-bold mb-2">Bảo mật tài khoản</div>

    <div className="flex items-center justify-between rounded-2xl border border-slate-100 px-5 py-4">
      <div>
        <div className="font-semibold">Mật khẩu</div>
        <div className="text-xs text-slate-500">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản</div>
      </div>
      <button
        onClick={onChangePassword}
        className="text-sm font-bold text-[var(--color-primary-dark)] bg-[var(--color-primary-dark)]/10 hover:bg-[var(--color-primary-dark)]/15 px-4 py-2 rounded-xl"
        disabled={saving}
      >
        Đổi mật khẩu
      </button>
    </div>

    <div className="flex items-center justify-between rounded-2xl border border-slate-100 px-5 py-4">
      <div>
        <div className="font-semibold">Xác thực hai lớp (2FA)</div>
        <div className="text-xs text-slate-500">Bảo vệ tài khoản bằng mã OTP qua email</div>
      </div>
      <button
        type="button"
        onClick={onToggle2FA}
        disabled={saving}
        className={`relative inline-flex h-6.5 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          is2FAEnabled ? 'bg-[var(--color-primary-dark)]' : 'bg-slate-200'
        }`}
        role="switch"
        aria-checked={is2FAEnabled}
      >
        <span
          className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            is2FAEnabled ? 'translate-x-5.5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  </div>
));

SecuritySection.displayName = 'SecuritySection';

export default SecuritySection;

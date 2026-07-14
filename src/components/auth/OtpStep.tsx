'use client';

import React from 'react';

interface OtpStepProps {
  otpDigits: string[];
  maskedEmail: string;
  resendCooldown: number;
  isLoading: boolean;
  error?: string;
  otpRefs: React.RefObject<(HTMLInputElement | null)[]>;
  onVerify: (digits?: string[]) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  onOtpChange: (index: number, value: string) => void;
  onOtpKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onOtpPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}

export default function OtpStep({
  otpDigits,
  maskedEmail,
  resendCooldown,
  isLoading,
  error,
  otpRefs,
  onVerify,
  onResend,
  onBack,
  onOtpChange,
  onOtpKeyDown,
  onOtpPaste,
}: OtpStepProps) {
  return (
    <div className="space-y-5 flex-1 flex flex-col justify-between py-1">
      <div className="space-y-4">
        <button
          id="register-otp-back"
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          Quay lại
        </button>

        <div className="text-center space-y-1.5">
          <div className="mx-auto flex items-center justify-center h-11 w-11 rounded-full bg-[var(--color-primary-lightest)] border border-[var(--color-primary)]">
            <svg className="h-5 w-5 text-[var(--color-primary-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Xác minh email</h2>
          <p className="text-xs text-slate-500">
            Mã 6 số đã gửi đến <span className="font-semibold text-slate-700">{maskedEmail}</span>
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex justify-center gap-2" onPaste={onOtpPaste}>
          {otpDigits.map((digit, i) => (
            <input
              id={`register-otp-digit-${i + 1}`}
              key={i}
              ref={(el) => {
                if (otpRefs.current) {
                  otpRefs.current[i] = el;
                }
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => onOtpChange(i, e.target.value)}
              onKeyDown={(e) => onOtpKeyDown(i, e)}
              className={`h-13 w-11 cursor-text rounded-xl border bg-white text-center text-lg font-bold text-slate-900 transition-all ${error ? 'border-red-300' : 'border-slate-200'}`}
              autoComplete="one-time-code"
            />
          ))}
        </div>
      </div>

      <div className="space-y-4 mt-auto pt-4">
        <button
          id="register-otp-verify"
          type="button"
          onClick={() => onVerify()}
          disabled={isLoading || otpDigits.some((d) => !d)}
          className="w-full py-3 px-4 rounded-2xl text-base font-bold text-white bg-[var(--color-primary-darker)] hover:bg-[var(--color-primary-hover)] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all min-h-[44px] cursor-pointer flex items-center justify-center"
        >
          {isLoading ? 'Đang xác minh...' : 'Xác minh'}
        </button>

        <div className="text-center text-xs">
          <span className="text-slate-500">Không nhận mã? </span>
          {resendCooldown > 0 ? (
            <span className="text-slate-400">Gửi lại sau {resendCooldown} giây</span>
          ) : (
            <button
              id="register-otp-resend"
              type="button"
              onClick={onResend}
              disabled={isLoading}
              className="font-bold text-slate-700 hover:text-[var(--color-primary-darker)] hover:underline transition-colors cursor-pointer disabled:opacity-50"
            >
              Gửi lại mã
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

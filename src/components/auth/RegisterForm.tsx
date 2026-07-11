'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import { ROUTES } from '@/lib/constants';
import { setStoredUser } from '@/lib/user';
import { registerSchema } from '@/lib/validations/auth';
import type { ToastHandler } from '@/hooks/useToast';
import type { BasicUser } from '@/types/profile';
import OtpStep from './OtpStep';
import SuccessStep from './SuccessStep';

type Step = 'form' | 'otp' | 'success';

type SendOtpResponse = {
  success?: boolean;
  data?: {
    maskedEmail?: string;
  };
  maskedEmail?: string;
};

type VerifyOtpResponse = {
  success?: boolean;
  data?: { user?: BasicUser };
};

type RegisterErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  agreeTerms?: string;
  form?: string;
  otp?: string;
};

type SendOtpErrorField = 'form' | 'otp';

type SendOtpOptions = {
  errorField: SendOtpErrorField;
  failureFallback: string;
  connectionMessage: string;
  successMessage: string;
  goToOtpStep?: boolean;
};

const AUTH_SUCCESS_TOAST_MS = 2600;
const OTP_LENGTH = 6;

function createEmptyOtpDigits(): string[] {
  return Array.from({ length: OTP_LENGTH }, () => '');
}

function getSendOtpError(field: SendOtpErrorField, message: string): RegisterErrors {
  return field === 'form' ? { form: message } : { otp: message };
}

function requestSendOtp(email: string, fullName: string): Promise<{ response: Response; data: SendOtpResponse }> {
  return apiRequest<SendOtpResponse>('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), fullName: fullName.trim() }),
  });
}

interface RegisterFormProps {
  onSuccess?: () => void;
  onAuthenticated?: (user: BasicUser) => void;
  onToast?: ToastHandler;
}

export default function RegisterForm({ onSuccess, onAuthenticated, onToast }: RegisterFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [otpDigits, setOtpDigits] = useState(createEmptyOtpDigits);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const validate = () => {
    if (!agreeTerms) {
      setErrors({ agreeTerms: 'Bạn phải đồng ý với Điều khoản dịch vụ' });
      return false;
    }

    const result = registerSchema.safeParse({
      fullName,
      email,
      password,
    });

    if (!result.success) {
      const tempErrors: RegisterErrors = {};
      result.error.issues.forEach(err => {
        const key = err.path[0] as keyof RegisterErrors;
        if (!tempErrors[key]) tempErrors[key] = err.message;
      });
      setErrors(tempErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const sendOtp = useCallback(async ({
    errorField,
    failureFallback,
    connectionMessage,
    successMessage,
    goToOtpStep = false,
  }: SendOtpOptions): Promise<void> => {
    setIsLoading(true);
    setErrors({});

    try {
      const { response, data } = await requestSendOtp(email, fullName);

      if (!response.ok) {
        const message = getApiErrorMessage(data, failureFallback);
        setErrors(getSendOtpError(errorField, message));
        onToast?.(message, 'error');
        return;
      }

      setMaskedEmail(data.data?.maskedEmail || data.maskedEmail || email);
      if (goToOtpStep) setStep('otp');
      setResendCooldown(60);
      setOtpDigits(createEmptyOtpDigits());
      onToast?.(successMessage, 'info');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      const message = connectionMessage;
      setErrors(getSendOtpError(errorField, message));
      onToast?.(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [email, fullName, onToast]);

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    await sendOtp({
      errorField: 'form',
      failureFallback: 'Không thể gửi mã xác minh',
      connectionMessage: 'Lỗi kết nối, vui lòng thử lại sau',
      successMessage: 'Mã xác minh đã được gửi đến email của bạn.',
      goToOtpStep: true,
    });
  };

  const handleVerifyOTP = useCallback(async (digits?: string[]) => {
    const code = (digits || otpDigits).join('');
    if (code.length !== 6) {
      const message = 'Vui lòng nhập đủ 6 chữ số';
      setErrors({ otp: message });
      onToast?.(message, 'warning');
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const { response, data } = await apiRequest<VerifyOtpResponse>('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: code,
          fullName: fullName.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const message = getApiErrorMessage(data, 'Xác minh thất bại');
        setErrors({ otp: message });
        onToast?.(message, 'error');
        if (response.status === 400) {
          setOtpDigits(createEmptyOtpDigits());
          setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }
        return;
      }

      await onToast?.('Đăng ký thành công. Chào mừng bạn đến với LOTUS TRAVEL.', 'success', AUTH_SUCCESS_TOAST_MS);

      const authedUser = data.data?.user;
      if (authedUser) {
        if (onAuthenticated) {
          onAuthenticated(authedUser);
        } else {
          setStoredUser(authedUser);
        }
      }
      setStep('success');
    } catch {
      const message = 'Lỗi kết nối, vui lòng thử lại sau';
      setErrors({ otp: message });
      onToast?.(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [otpDigits, email, fullName, password, onAuthenticated, onToast]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (value && index === 5 && newDigits.every((d) => d !== '')) {
      handleVerifyOTP(newDigits);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    pasted.split('').forEach((char, i) => {
      if (i < 6) newDigits[i] = char;
    });
    setOtpDigits(newDigits);

    const nextEmpty = newDigits.findIndex((c) => !c);
    const focusIdx = nextEmpty === -1 ? 5 : nextEmpty;
    otpRefs.current[focusIdx]?.focus();

    if (newDigits.every((c) => c !== '')) {
      handleVerifyOTP(newDigits);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    await sendOtp({
      errorField: 'otp',
      failureFallback: 'Không thể gửi lại mã',
      connectionMessage: 'Lỗi kết nối',
      successMessage: 'Mã xác minh mới đã được gửi.',
    });
  };

  const closeOnSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(ROUTES.home);
    }
  };

  if (step === 'success') {
    return <SuccessStep onClose={closeOnSuccess} />;
  }

  if (step === 'otp') {
    return (
      <OtpStep
        otpDigits={otpDigits}
        maskedEmail={maskedEmail}
        resendCooldown={resendCooldown}
        isLoading={isLoading}
        error={errors.otp}
        otpRefs={otpRefs}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        onBack={() => {
          setStep('form');
          setErrors({});
        }}
        onOtpChange={handleOtpChange}
        onOtpKeyDown={handleOtpKeyDown}
        onOtpPaste={handleOtpPaste}
      />
    );
  }

  return (
    <form className="flex-1 flex flex-col justify-between py-1" onSubmit={handleSendOTP} noValidate>
      <div className="space-y-5">
        {errors.form && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-start space-x-1.5">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errors.form}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="fullName" className="block text-xs font-semibold text-slate-800">Họ và tên</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={`block w-full px-3 py-3 bg-white ring-1 ring-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all min-h-[44px] ${errors.fullName ? 'ring-2 ring-red-300 ring-slate-200' : ''}`}
            placeholder="Nguyễn Văn A"
          />
          {errors.fullName && <p className="text-xs text-red-600 mt-0.5">{errors.fullName}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-semibold text-slate-800">Địa chỉ Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`block w-full px-3 py-3 bg-white ring-1 ring-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all min-h-[44px] ${errors.email ? 'ring-2 ring-red-300 ring-slate-200' : ''}`}
            placeholder="email@example.com"
          />
          {errors.email && <p className="text-xs text-red-600 mt-0.5">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-xs font-semibold text-slate-800">Mật khẩu</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`block w-full pl-3 pr-10 py-3 bg-white ring-1 ring-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all min-h-[44px] ${errors.password ? 'ring-2 ring-red-300 ring-slate-200' : ''}`}
              placeholder="Tối thiểu 8 ký tự"
            />
            {password.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors min-w-[44px] justify-center cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            )}
          </div>
          {errors.password && <p className="text-xs text-red-600 mt-0.5">{errors.password}</p>}
        </div>

        <div className="flex items-start gap-2 text-xs py-0.5">
          <input
            id="agreeTerms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-slate-700 focus:outline-none cursor-pointer"
          />
          <label htmlFor="agreeTerms" className="text-xs text-slate-700">
            Tôi đồng ý với <a href="#" className="font-semibold text-slate-700 hover:underline">Điều khoản</a> và <a href="#" className="font-semibold text-slate-700 hover:underline">Chính sách bảo mật</a>
          </label>
        </div>
        {errors.agreeTerms && <p className="text-xs text-red-600 -mt-1">{errors.agreeTerms}</p>}
      </div>

      <div className="space-y-4 mt-auto pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-2xl text-base font-bold text-white bg-[var(--color-primary-darker)] hover:bg-[var(--color-primary-hover)] focus:outline-none transition-all min-h-[44px] cursor-pointer flex items-center justify-center disabled:opacity-60"
        >
          {isLoading ? 'Đang gửi mã...' : 'TIẾP TỤC'}
        </button>

        <button
          type="button"
          disabled
          title="Tính năng đang phát triển"
          className="w-full flex items-center justify-center px-3 py-2.5 bg-white ring-1 ring-slate-200 rounded-full text-xs font-semibold text-slate-800 opacity-60 cursor-not-allowed min-h-[44px] space-x-2"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.53 5.53 0 0 1 8.4 13a5.53 5.53 0 0 1 5.59-5.519c2.494 0 4.597 1.637 5.253 3.896l3.962-3.07C21.08 4.265 17.784 2 13.99 2 7.92 2 3 6.92 3 13s4.92 11 10.99 11c5.73 0 10.51-4.114 10.99-9.715H12.24z" />
          </svg>
          <span className="truncate text-slate-800 font-semibold">Đăng ký với Google</span>
        </button>
      </div>
    </form>
  );
}

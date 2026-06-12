'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiErrorMessage } from '@/lib/api-client';
import { setStoredUser } from '@/lib/user';
import { loginSchema } from '@/lib/validations/auth';

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isSuccess) return;

    const timer = setTimeout(() => {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/profile');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isSuccess, router, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse({
      email: email.trim(),
      password,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });

      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: result.data.email, password: result.data.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: getApiErrorMessage(data, 'Email hoặc mật khẩu không chính xác') });
        return;
      }

      setIsSuccess(true);
      setStoredUser(data.user);
    } catch {
      setErrors({ form: 'Lỗi kết nối, vui lòng thử lại sau' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-6 space-y-4 flex-1 flex flex-col justify-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-slate-50 border border-slate-100">
          <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Đăng nhập thành công!</h2>
        <p className="text-slate-600 text-sm">Đang chuyển hướng đến hồ sơ của bạn...</p>
      </div>
    );
  }

  return (
    <form className="flex-1 flex flex-col justify-between py-1" onSubmit={handleSubmit} noValidate>
      <div className="space-y-6">
        {errors.form && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start space-x-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errors.form}</span>
          </div>
        )}


        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
            Địa chỉ Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
              </svg>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`block w-full pl-10 pr-3 py-3.5 bg-white ring-1 ring-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-base focus:outline-none transition-all min-h-[44px] cursor-text ${errors.email ? 'ring-2 ring-red-300 ring-slate-200' : ''}`}
              placeholder="email@example.com"
            />
          </div>
          {errors.email && <p className="text-sm text-red-600 mt-1 pl-1">{errors.email}</p>}
        </div>


        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
            Mật khẩu
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`block w-full pl-10 pr-10 py-3.5 bg-white ring-1 ring-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-base focus:outline-none transition-all min-h-[44px] cursor-text ${errors.password ? 'ring-2 ring-red-300 ring-slate-200' : ''}`}
              placeholder="••••••••"
            />
            {password.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
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

          <div className="flex justify-end">
            <a href="#" className="text-xs font-bold text-slate-700 hover:text-[var(--color-primary-darker)] hover:underline transition-colors cursor-pointer">
              Quên mật khẩu?
            </a>
          </div>

          {errors.password && <p className="text-sm text-red-600 mt-1 pl-1">{errors.password}</p>}
        </div>
      </div>


      <div className="space-y-4 mt-auto pt-7">

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-2xl text-base font-bold text-white bg-[var(--color-primary-darker)] hover:bg-[var(--color-primary-hover)] focus:outline-none transition-all min-h-[44px] cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            <span>TIẾP TỤC</span>
          )}
        </button>

        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative px-3 bg-white text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Hoặc đăng nhập bằng
          </span>
        </div>

        <button
          type="button"
          disabled
          title="Tính năng đang phát triển"
          className="w-full flex items-center justify-center px-3 py-2.5 bg-white ring-1 ring-slate-200 rounded-full text-xs font-semibold text-slate-800 opacity-60 cursor-not-allowed min-h-[44px] space-x-2"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.53 5.53 0 0 1 8.4 13a5.53 5.53 0 0 1 5.59-5.519c2.494 0 4.597 1.637 5.253 3.896l3.962-3.07C21.08 4.265 17.784 2 13.99 2 7.92 2 3 6.92 3 13s4.92 11 10.99 11c5.73 0 10.51-4.114 10.99-9.715H12.24z" />
          </svg>
          <span className="truncate text-slate-800 font-semibold">Đăng nhập với Google</span>
        </button>
      </div>
    </form>
  );
}


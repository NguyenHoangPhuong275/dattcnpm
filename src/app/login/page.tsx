'use client';

import React from 'react';
import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="relative min-h-dvh flex items-center justify-center bg-[var(--color-primary)] px-4 bg-grid-pattern">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[var(--color-primary-lightest)]/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-[var(--color-primary-light)]/30 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl space-y-3 z-10">
        <div className="flex flex-col items-center text-center">
          <img src="/images/logo.svg" alt="Logo LOTUS TRAVEL" className="w-24 h-24 sm:w-28 sm:h-28 mb-2" />
        </div>

        <div className="bg-white/95 border border-white/50 rounded-3xl p-6 sm:p-7 shadow-xl">
          <LoginForm />
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-500 font-semibold">
            Bạn chưa có tài khoản?{' '}
            <Link href="/register" className="font-semibold text-[var(--color-primary-darker)] hover:underline transition-colors cursor-pointer">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

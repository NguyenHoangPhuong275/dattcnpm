'use client';

import Image from 'next/image';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';

export type AuthMode = 'login' | 'register' | null;

interface AuthModalProps {
  authMode: AuthMode;
  isClosing: boolean;
  onClose: () => void;
  onModeChange: (mode: 'login' | 'register') => void;
}

export default function AuthModal({ authMode, isClosing, onClose, onModeChange }: AuthModalProps) {
  if (!authMode) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={onClose}
      />

      <div
        className={`auth-slide relative z-10 flex h-[580px] w-full max-w-[850px] flex-col overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-2xl md:h-[620px] md:flex-row ${isClosing ? 'closing' : ''}`}
      >
        <div className="relative h-48 w-full flex-shrink-0 overflow-hidden bg-slate-100 md:h-full md:w-[48%]">
          <Image
            src="/images/hoian_auth.png"
            alt="Phố cổ Hội An"
            fill
            sizes="(max-width: 768px) 100vw, 408px"
            className="object-cover"
          />
        </div>

        <div className="relative flex h-full flex-1 flex-col justify-between bg-white p-6 sm:p-8 md:p-10">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <span className="block text-xl leading-none">×</span>
          </button>

          <div className="flex h-full flex-1 flex-col justify-between">
            <h2 className="mb-6 flex-shrink-0 text-center text-2xl font-extrabold text-slate-900">
              {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </h2>

            <div className="flex flex-1 flex-col pr-1">
              {authMode === 'login' ? (
                <LoginForm onSuccess={onClose} />
              ) : (
                <RegisterForm onSuccess={onClose} />
              )}
            </div>

            <div className="mt-6 flex-shrink-0 border-t border-slate-200/70 pt-4 text-center text-xs text-slate-500">
              {authMode === 'login' ? (
                <>
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => onModeChange('register')}
                    className="font-bold text-[var(--color-primary-darker)] hover:underline"
                  >
                    Đăng ký ngay
                  </button>
                </>
              ) : (
                <>
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => onModeChange('login')}
                    className="font-bold text-[var(--color-primary-darker)] hover:underline"
                  >
                    Đăng nhập
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

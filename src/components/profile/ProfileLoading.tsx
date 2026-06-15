import React from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ProfileLoading(): React.JSX.Element {
  return (
    <div
      className="relative flex min-h-dvh items-center justify-center bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: "url('/images/profile_hero.png')" }}
    >
      <div className="absolute inset-0 z-0 bg-white/70 backdrop-blur-[2px]" />
      <div className="relative z-10 text-center">
        <LoadingSpinner size="lg" className="mx-auto text-[var(--color-primary-dark)]" />
        <p className="mt-4 text-sm font-semibold text-slate-500">Đang tải thông tin...</p>
      </div>
    </div>
  );
}

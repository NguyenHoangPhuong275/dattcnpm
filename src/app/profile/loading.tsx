import React from 'react';

export default function ProfileLoading(): React.JSX.Element {
  return (
    <div
      className="relative flex min-h-dvh items-center justify-center bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: "url('/images/profile_hero.png')" }}
    >
      <div className="absolute inset-0 z-0 bg-white/70 backdrop-blur-[2px]" />
      <div className="relative z-10 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary-dark)] border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-slate-500">Đang tải thông tin...</p>
      </div>
    </div>
  );
}

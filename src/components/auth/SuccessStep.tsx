'use client';

import React from 'react';

interface SuccessStepProps {
  onClose: () => void;
}

export default function SuccessStep({ onClose }: SuccessStepProps) {
  return (
    <div className="text-center py-4 space-y-3 flex-1 flex flex-col justify-center">
      <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-[var(--color-primary-lightest)] border border-[var(--color-primary)] text-slate-800">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-slate-900">Đăng ký thành công!</h2>
      <p className="text-slate-600 text-sm">Email đã được xác minh. Chào mừng bạn gia nhập LOTUS TRAVEL.</p>
      <div className="pt-1">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex justify-center w-full py-3 px-4 rounded-2xl text-base font-bold text-white bg-[var(--color-primary-darker)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] focus:ring-offset-white transition-all cursor-pointer min-h-[44px] items-center"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

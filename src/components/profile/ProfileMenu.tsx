'use client';

import React, { memo } from 'react';
import { ProfileTab } from '@/types/profile';

interface TabButtonProps {
  tab: ProfileTab;
  label: string;
  isActive: boolean;
  onClick: (tab: ProfileTab) => void;
  icon: React.JSX.Element;
}

const TabButton = memo(({ tab, label, isActive, onClick, icon }: TabButtonProps) => (
  <button
    id={`profile-tab-${tab}`}
    type="button"
    onClick={() => onClick(tab)}
    aria-pressed={isActive}
    className={`flex w-auto shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-4 py-2.5 text-left text-sm font-medium transition-colors lg:w-full lg:gap-3 ${
      isActive
        ? 'bg-[var(--color-primary-lightest)] text-[var(--color-primary-darker)]'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <span className={`shrink-0 ${isActive ? 'text-[var(--color-primary-darker)]' : 'text-slate-400'}`}>
      {icon}
    </span>
    <span>{label}</span>
  </button>
));

TabButton.displayName = 'TabButton';

interface ProfileMenuProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

export default function ProfileMenu({ activeTab, onTabChange }: ProfileMenuProps) {
  return (
    <div className="w-full flex-shrink-0 lg:w-56">
      <div className="mb-2 lg:mb-4">
        <div className="flex items-center gap-2.5 px-3 py-2 font-display text-sm font-bold text-[var(--color-primary-dark)]">
          <svg className="h-4.5 w-4.5 text-[var(--color-primary-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Tài khoản du lịch</span>
        </div>
      </div>

      <nav aria-label="Các mục hồ sơ" className="flex gap-2 overflow-x-auto pb-2 text-sm lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        <TabButton
          tab="personal"
          label="Thông tin của bạn"
          isActive={activeTab === 'personal'}
          onClick={onTabChange}
          icon={<svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />

        <TabButton
          tab="trips"
          label="Danh sách chuyến đi"
          isActive={activeTab === 'trips'}
          onClick={onTabChange}
          icon={<svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <TabButton
          tab="bookings"
          label="Đặt chỗ của tôi"
          isActive={activeTab === 'bookings'}
          onClick={onTabChange}
          icon={<svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
        <TabButton
          tab="favorites"
          label="Địa điểm yêu thích"
          isActive={activeTab === 'favorites'}
          onClick={onTabChange}
          icon={<svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>}
        />

        <TabButton
          tab="security"
          label="Bảo mật"
          isActive={activeTab === 'security'}
          onClick={onTabChange}
          icon={<svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
        />
      </nav>
    </div>
  );
}

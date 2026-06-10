'use client';

import React, { memo } from 'react';

export type ProfileTab = 'personal' | 'preferences' | 'trips' | 'favorites' | 'reviews' | 'security' | 'search-history';

interface TabButtonProps {
  tab: ProfileTab;
  label: string;
  isActive: boolean;
  onClick: (tab: ProfileTab) => void;
}

const TabButton = memo(({ tab, label, isActive, onClick }: TabButtonProps) => (
  <button
    onClick={() => onClick(tab)}
    className={`w-full text-left px-5 py-3 rounded-2xl transition-colors duration-150 text-sm font-semibold border-l-4 ${
      isActive
        ? 'text-[var(--color-primary-darker)] bg-[var(--color-primary-light)]/60 font-bold border-[var(--color-primary-darker)]'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border-transparent'
    }`}
  >
    {label}
  </button>
));
TabButton.displayName = 'TabButton';

interface ProfileMenuProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

export default function ProfileMenu({ activeTab, onTabChange }: ProfileMenuProps) {
  return (
    <div className="w-full lg:w-56 flex-shrink-0">
      <div className="mb-4">
        <div className="flex items-center gap-2.5 text-[var(--color-primary-dark)] font-display font-bold text-sm px-3 py-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Tài khoản du lịch</span>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <TabButton tab="personal" label="Thông tin cá nhân" isActive={activeTab === 'personal'} onClick={onTabChange} />
        <TabButton tab="preferences" label="Sở thích du lịch" isActive={activeTab === 'preferences'} onClick={onTabChange} />
        <TabButton tab="trips" label="Hành trình của tôi" isActive={activeTab === 'trips'} onClick={onTabChange} />
        <TabButton tab="favorites" label="Địa điểm yêu thích" isActive={activeTab === 'favorites'} onClick={onTabChange} />
        <TabButton tab="search-history" label="Lịch sử tìm kiếm" isActive={activeTab === 'search-history'} onClick={onTabChange} />
        <TabButton tab="reviews" label="Đánh giá của tôi" isActive={activeTab === 'reviews'} onClick={onTabChange} />
        <TabButton tab="security" label="Bảo mật" isActive={activeTab === 'security'} onClick={onTabChange} />
      </div>
    </div>
  );
}

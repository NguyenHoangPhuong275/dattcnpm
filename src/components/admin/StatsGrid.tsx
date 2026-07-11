'use client';

import React from 'react';

interface Stats {
  users?: number;
  trips?: number;
  places?: number;
  itineraryItems?: number;
  favorites?: number;
  searchHistories?: number;
  auditLogs?: number;
  reviews?: number;
  notifications?: number;
}

interface StatItem {
  label: string;
  key: keyof Stats;
  icon: string;
}

const statItems: StatItem[] = [
  {
    label: 'Tài khoản',
    key: 'users',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    label: 'Chuyến đi',
    key: 'trips',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    label: 'Địa điểm',
    key: 'places',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    label: 'Đánh giá',
    key: 'reviews',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  {
    label: 'Mục lịch trình',
    key: 'itineraryItems',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    label: 'Yêu thích',
    key: 'favorites',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  },
  {
    label: 'Lượt tìm kiếm',
    key: 'searchHistories',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  },
  {
    label: 'Thông báo',
    key: 'notifications',
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },
  {
    label: 'Nhật ký hệ thống',
    key: 'auditLogs',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
];

interface StatsGridProps {
  stats: Stats | null;
  isLoading: boolean;
}

export default function StatsGrid({ stats, isLoading }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {statItems.map((item) => (
        <div
          key={item.key}
          className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm transition-all hover:border-[var(--color-border-strong)]"
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-[var(--color-text-secondary)]">{item.label}</span>
            <svg className="w-5 h-5 text-[var(--color-primary-darker)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
            </svg>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded-md bg-[var(--color-bg)]" />
            ) : (
              <span className="text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
                {stats ? (stats[item.key] ?? '—') : '—'}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

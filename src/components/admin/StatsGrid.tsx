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
  color: string;
  icon: string;
}

const statItems: StatItem[] = [
  {
    label: 'Tài khoản',
    key: 'users',
    color: 'border-blue-500/20 text-blue-400 bg-blue-500/5',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    label: 'Chuyến đi',
    key: 'trips',
    color: 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    label: 'Địa điểm',
    key: 'places',
    color: 'border-teal-500/20 text-teal-400 bg-teal-500/5',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    label: 'Đánh giá',
    key: 'reviews',
    color: 'border-amber-500/20 text-amber-400 bg-amber-500/5',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
];

interface StatsGridProps {
  stats: Stats | null;
  isLoading: boolean;
}

export default function StatsGrid({ stats, isLoading }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <div
          key={item.key}
          className={`border rounded-2xl p-5 backdrop-blur-md transition-all shadow-md ${item.color}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm font-semibold">{item.label}</span>
            <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
            </svg>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded-md" />
            ) : (
              <span className="text-3xl font-extrabold tracking-tight">
                {stats ? (stats[item.key] ?? '—') : '—'}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

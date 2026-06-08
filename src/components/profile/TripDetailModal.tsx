'use client';

import React from 'react';
import { TripSummary } from './MyTripsSection';

interface TripDetailModalProps {
  trip: TripSummary | null;
  onClose: () => void;
}

export default function TripDetailModal({ trip, onClose }: TripDetailModalProps) {
  if (!trip) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Chi tiết chuyến đi</h3>
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">Đóng</button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-slate-700">Tiêu đề:</span>
            <div className="mt-0.5 text-slate-800">{trip.title}</div>
          </div>
          <div>
            <span className="font-medium text-slate-700">Điểm đến:</span>
            <div className="mt-0.5 text-slate-800">{trip.destination}</div>
          </div>
          <div>
            <span className="font-medium text-slate-700">Thời gian:</span>
            <div className="mt-0.5 text-slate-800">{trip.startDate} → {trip.endDate}</div>
          </div>
          <div>
            <span className="font-medium text-slate-700">Trạng thái:</span>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold ${trip.isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              {trip.isPublic ? 'Công khai' : 'Riêng tư'}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t text-xs text-slate-500">
          Chi tiết đầy đủ (lịch trình, ngân sách, chỗ ở...) sẽ được phát triển trong phiên bản sau.
        </div>
      </div>
    </div>
  );
}

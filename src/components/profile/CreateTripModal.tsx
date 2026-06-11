'use client';

import React from 'react';

interface CreateTripModalProps {
  open: boolean;
  title: string;
  destination: string;
  creating: boolean;
  onClose: () => void;
  onTitleChange: (v: string) => void;
  onDestChange: (v: string) => void;
  onCreate: () => void;
}

export default function CreateTripModal({
  open,
  title,
  destination,
  creating,
  onClose,
  onTitleChange,
  onDestChange,
  onCreate
}: CreateTripModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 border border-slate-200">
        <h3 className="font-semibold text-lg mb-4">Tạo chuyến đi mới</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tiêu đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
              placeholder="Hội An 4 ngày"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Điểm đến</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => onDestChange(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
              placeholder="Hội An, Quảng Nam"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-slate-300 rounded-xl text-sm hover:bg-slate-50"
            disabled={creating}
          >
            Hủy
          </button>
          <button
            onClick={onCreate}
            className="flex-1 py-2 bg-[var(--color-primary-dark)] text-white rounded-xl text-sm font-semibold disabled:opacity-60"
            disabled={creating}
          >
            {creating ? 'Đang tạo...' : 'Tạo chuyến đi'}
          </button>
        </div>
      </div>
    </div>
  );
}

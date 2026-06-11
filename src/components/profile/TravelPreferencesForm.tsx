'use client';

import React, { memo } from 'react';

export interface TravelPreferences {
  travelStyles: string[];
  interests: string[];
  budgetLevel: 'Tiết kiệm' | 'Trung bình' | 'Thoải mái' | 'Sang trọng';
  preferredDestinations: string[];
}

interface TravelPreferencesFormProps {
  preferences: TravelPreferences;
  onPreferenceChange: <K extends keyof TravelPreferences>(field: K, value: TravelPreferences[K]) => void;
  onToggleInterest: (tag: string) => void;
  onSave: (e: React.FormEvent) => void;
  saving?: boolean;
}

const TravelPreferencesForm = memo(({
  preferences,
  onPreferenceChange,
  onToggleInterest,
  onSave,
  saving
}: TravelPreferencesFormProps) => (
  <form onSubmit={onSave} className="space-y-8">
    <div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Phong cách du lịch yêu thích</div>
      <div className="flex flex-wrap gap-2">
        {['Solo', 'Couple', 'Family', 'Group', 'Adventure', 'Relax'].map(style => (
          <button
            key={style}
            type="button"
            onClick={() => {
              const has = preferences.travelStyles.includes(style);
              onPreferenceChange('travelStyles', has ? preferences.travelStyles.filter(s => s !== style) : [...preferences.travelStyles, style]);
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${preferences.travelStyles.includes(style) ? 'bg-[var(--color-primary-dark)] text-white border-[var(--color-primary-dark)]' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}
          >
            {style}
          </button>
        ))}
      </div>
    </div>

    <div>
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Sở thích / Chủ đề quan tâm</div>
      <div className="flex flex-wrap gap-2">
        {['Biển', 'Núi', 'Thiên nhiên', 'Văn hóa', 'Lịch sử', 'Ẩm thực', 'Phiêu lưu', 'Chụp ảnh', 'Spa & Nghỉ dưỡng'].map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => onToggleInterest(tag)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${preferences.interests.includes(tag) ? 'bg-[var(--color-primary-dark)] text-white border-[var(--color-primary-dark)]' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mức chi tiêu mong muốn</label>
        <div className="relative">
          <select
            value={preferences.budgetLevel}
            onChange={(e) => onPreferenceChange('budgetLevel', e.target.value as TravelPreferences['budgetLevel'])}
            className="w-full appearance-none bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 pr-10 text-sm font-semibold outline-none transition-all cursor-pointer"
          >
            <option value="Tiết kiệm">Tiết kiệm</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Thoải mái">Thoải mái</option>
            <option value="Sang trọng">Sang trọng</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Điểm đến yêu thích (gợi ý)</label>
        <input
          type="text"
          value={preferences.preferredDestinations.join(', ')}
          onChange={(e) => onPreferenceChange('preferredDestinations', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all"
          placeholder="Đà Lạt, Hội An, Sapa..."
        />
      </div>
    </div>

    <div className="flex justify-end pt-4 border-t border-slate-100">
      <button type="submit" disabled={saving} className="rounded-2xl bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary-darker)] text-white px-8 py-3 text-sm font-semibold shadow-sm active:scale-[0.985] transition-all disabled:opacity-60">
        {saving ? 'Đang lưu...' : 'Lưu sở thích du lịch'}
      </button>
    </div>
  </form>
));

TravelPreferencesForm.displayName = 'TravelPreferencesForm';

export default TravelPreferencesForm;

'use client';

import React, { memo } from 'react';

import {
  BUDGET_LEVEL_OPTIONS,
  TRAVEL_INTEREST_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
} from '@/data/travel-preferences';
import { useFormSubmitError } from '@/hooks/useFormSubmitError';
import type { TravelPreferences } from '@/types/profile';

interface TravelPreferencesFormProps {
  preferences: TravelPreferences;
  onPreferenceChange: <K extends keyof TravelPreferences>(field: K, value: TravelPreferences[K]) => void;
  onToggleInterest: (tag: TravelPreferences['interests'][number]) => void;
  onSave: (e: React.FormEvent) => Promise<{ success: boolean; error?: string }> | void;
  saving?: boolean;
}

const TravelPreferencesForm = memo(({
  preferences,
  onPreferenceChange,
  onToggleInterest,
  onSave,
  saving
}: TravelPreferencesFormProps) => {
  const { formError, handleSubmit } = useFormSubmitError(onSave, 'Không thể lưu sở thích lúc này');

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Phong cách du lịch yêu thích</div>
        <div className="flex flex-wrap gap-2">
          {TRAVEL_STYLE_OPTIONS.map((style) => (
            <button
              id={`profile-travel-style-${style.value}`}
              key={style.value}
              type="button"
              onClick={() => {
                const has = preferences.travelStyles.includes(style.value);
                onPreferenceChange('travelStyles', has ? preferences.travelStyles.filter((value) => value !== style.value) : [...preferences.travelStyles, style.value]);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${preferences.travelStyles.includes(style.value) ? 'bg-[var(--color-primary-dark)] text-white border-[var(--color-primary-dark)]' : 'bg-[var(--color-surface)] hover:bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Sở thích / Chủ đề quan tâm</div>
        <div className="flex flex-wrap gap-2">
          {TRAVEL_INTEREST_OPTIONS.map((interest) => (
            <button
              id={`profile-travel-interest-${interest.value}`}
              key={interest.value}
              type="button"
              onClick={() => onToggleInterest(interest.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${preferences.interests.includes(interest.value) ? 'bg-[var(--color-primary-dark)] text-white border-[var(--color-primary-dark)]' : 'bg-[var(--color-surface)] hover:bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
            >
              {interest.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="profile-budget-level" className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Mức chi tiêu mong muốn</label>
          <div className="relative">
            <select
              id="profile-budget-level"
              value={preferences.budgetLevel}
              onChange={(e) => onPreferenceChange('budgetLevel', e.target.value as TravelPreferences['budgetLevel'])}
              className="w-full appearance-none bg-[var(--color-bg)]/50 hover:bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl px-4 py-3 pr-10 text-sm font-semibold outline-none transition-all cursor-pointer"
            >
              {BUDGET_LEVEL_OPTIONS.map((budget) => (
                <option key={budget.value} value={budget.value}>{budget.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-text-muted)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="profile-preferred-destinations" className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Điểm đến yêu thích (gợi ý)</label>
          <input
            id="profile-preferred-destinations"
            type="text"
            value={preferences.preferredDestinations.join(', ')}
            onChange={(e) => onPreferenceChange('preferredDestinations', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            className="w-full bg-[var(--color-bg)]/50 hover:bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all"
            placeholder="Đà Lạt, Hội An, Sapa..."
          />
        </div>
      </div>

      <div className="flex flex-col items-end gap-3 pt-4 border-t border-[var(--color-border)]">
        <button id="profile-save-travel-preferences" type="submit" disabled={saving} className="rounded-2xl bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary-darker)] text-white px-8 py-3 text-sm font-semibold shadow-sm active:scale-[0.985] transition-all disabled:opacity-60">
          {saving ? 'Đang lưu...' : 'Lưu sở thích du lịch'}
        </button>
        {formError && (
          <p role="alert" className="text-sm font-semibold text-[var(--color-danger)]">
            {formError}
          </p>
        )}
      </div>
    </form>
  );
});

TravelPreferencesForm.displayName = 'TravelPreferencesForm';

export default TravelPreferencesForm;

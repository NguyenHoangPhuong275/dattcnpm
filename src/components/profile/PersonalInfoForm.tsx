'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useFormSubmitError } from '@/hooks/useFormSubmitError';
import type { PersonalInfo } from '@/types/profile';

export type { PersonalInfo };

interface PersonalInfoFormProps {
  personal: PersonalInfo;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFullNameChange: (value: string) => void;
  onSave: (e: React.FormEvent) => Promise<{ success: boolean; error?: string }> | void;
  onAvatarChange?: (url: string) => void;
  saving?: boolean;
  onToast?: (msg: string) => void;
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const GENDER_OPTIONS = [
  { id: 'male', value: 'Nam' },
  { id: 'female', value: 'Nữ' },
  { id: 'other', value: 'Khác' },
] as const;

const fieldClass = 'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-normal text-slate-800 transition-colors disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-75';
const labelClass = 'block text-sm font-semibold text-slate-700 mb-1.5';

function initials(personal: PersonalInfo): string {
  const first = personal.firstName?.trim()[0] || 'U';
  const last = personal.lastName?.trim()[0] || '';
  return `${first}${last}`.toUpperCase();
}

const PersonalInfoForm = memo(({
  personal,
  onChange,
  onFullNameChange,
  onSave,
  onAvatarChange,
  saving,
  onToast,
}: PersonalInfoFormProps): React.JSX.Element => {
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [fullNameDraft, setFullNameDraft] = useState(
    () => `${personal.firstName} ${personal.lastName}`.trim(),
  );
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const editingFullNameRef = useRef(false);
  const { formError, handleSubmit } = useFormSubmitError(onSave, 'Không thể lưu thông tin lúc này');

  useEffect(() => {
    setAvatarBroken(false);
  }, [personal.avatarUrl]);

  useEffect(() => {
    if (!editingFullNameRef.current) {
      setFullNameDraft(`${personal.firstName} ${personal.lastName}`.trim());
    }
  }, [personal.firstName, personal.lastName]);

  const handleAvatarFile = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      const message = 'Chỉ chấp nhận JPG, PNG hoặc WebP.';
      setAvatarError(message);
      onToast?.(message);
      event.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      const message = 'Ảnh đại diện tối đa 2MB.';
      setAvatarError(message);
      onToast?.(message);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent): void => {
      const result = readerEvent.target?.result;
      if (typeof result === 'string') {
        onAvatarChange?.(result);
      }
      event.target.value = '';
    };
    reader.onerror = (): void => {
      const message = 'Không thể đọc file ảnh.';
      setAvatarError(message);
      onToast?.(message);
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <form id="profile-personal-form" onSubmit={handleSubmit} className="space-y-6 bg-white py-2">
      <div className="space-y-2.5">
        <div className="text-sm font-semibold text-slate-800">Ảnh đại diện</div>
        <button
          id="profile-avatar-button"
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          className="group relative h-20 w-20 cursor-pointer overflow-hidden rounded-full bg-[var(--color-primary-dark)] text-white flex items-center justify-center transition shadow-sm"
          title="Thay đổi ảnh đại diện"
          aria-label="Thay đổi ảnh đại diện"
          aria-describedby={avatarError ? 'profile-avatar-help profile-avatar-error' : 'profile-avatar-help'}
        >
          {personal.avatarUrl && !avatarBroken ? (
            <Image
              src={personal.avatarUrl}
              alt={`Ảnh đại diện của ${personal.firstName} ${personal.lastName}`.trim() || 'Ảnh đại diện'}
              fill
              sizes="80px"
              className="object-cover"
              unoptimized
              onError={() => setAvatarBroken(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold">{initials(personal)}</div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </button>
        <input
          id="avatar-file-input"
          ref={avatarInputRef}
          type="file"
          accept={ACCEPTED_AVATAR_TYPES.join(',')}
          className="hidden"
          onChange={handleAvatarFile}
        />
        <p id="profile-avatar-help" className="text-xs text-[var(--color-text-muted)]">
          JPG, PNG hoặc WebP, tối đa 2MB.
        </p>
        {avatarError && <p id="profile-avatar-error" role="alert" className="text-xs font-semibold text-[var(--color-danger)]">{avatarError}</p>}
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label htmlFor="profile-full-name" className={labelClass}>Họ và tên</label>
            <input
              id="profile-full-name"
              type="text"
              value={fullNameDraft}
              onFocus={() => { editingFullNameRef.current = true; }}
              onChange={(event) => {
                setFullNameDraft(event.target.value);
                onFullNameChange(event.target.value);
              }}
              onBlur={(event) => {
                editingFullNameRef.current = false;
                const normalized = event.currentTarget.value.trim().replace(/\s+/g, ' ');
                setFullNameDraft(normalized);
                onFullNameChange(normalized);
              }}
              className={fieldClass}
              required
            />
          </div>

          <div>
            <div className={labelClass}>Giới tính</div>
            <div className="flex items-center gap-6 py-2">
              {GENDER_OPTIONS.map((gender) => (
                <label key={gender.value} htmlFor={`profile-gender-${gender.id}`} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 font-medium">
                  <input
                    id={`profile-gender-${gender.id}`}
                    type="radio"
                    name="gender"
                    value={gender.value}
                    checked={personal.gender === gender.value}
                    onChange={onChange}
                    className="h-4.5 w-4.5 accent-[var(--color-primary-darker)]"
                  />
                  {gender.value}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="profile-email" className={labelClass}>Email</label>
            <input
              id="profile-email"
              type="email"
              name="email"
              value={personal.email}
              readOnly
              disabled
              className={`${fieldClass} cursor-not-allowed`}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="profile-date-of-birth" className={labelClass}>Ngày sinh</label>
            <input id="profile-date-of-birth" type="date" name="dateOfBirth" value={personal.dateOfBirth || ''} onChange={onChange} className={fieldClass} />
          </div>

          <div>
            <label htmlFor="profile-phone" className={labelClass}>Số điện thoại</label>
            <input
              id="profile-phone"
              type="tel"
              name="phone"
              value={personal.phone || ''}
              onChange={onChange}
              placeholder=""
              maxLength={20}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="profile-home-city" className={labelClass}>Địa chỉ</label>
            <input id="profile-home-city" type="text" name="homeCity" value={personal.homeCity || ''} onChange={onChange} placeholder="" className={fieldClass} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-start gap-2">
        <button id="profile-save-button" type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary-darker)] px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--color-primary-hover)] disabled:opacity-60 cursor-pointer uppercase tracking-wider">
          {saving && <LoadingSpinner size="sm" />}
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
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

PersonalInfoForm.displayName = 'PersonalInfoForm';

export default PersonalInfoForm;

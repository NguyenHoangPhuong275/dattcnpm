'use client';

import React, { memo, useState } from 'react';
import Image from 'next/image';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PersonalInfo } from '@/types/profile';

export type { PersonalInfo };

interface PersonalInfoFormProps {
  personal: PersonalInfo;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFullNameChange: (value: string) => void;
  onSave: (e: React.FormEvent) => void;
  onAvatarChange?: (url: string) => void;
  saving?: boolean;
  onToast?: (msg: string) => void;
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const fieldClass = 'w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[var(--color-primary-dark)] focus:ring-4 focus:ring-[var(--color-primary-dark)]/10';

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
  const [avatarLoading, setAvatarLoading] = useState(false);

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

    setAvatarLoading(true);
    const reader = new FileReader();
    reader.onload = (readerEvent): void => {
      const result = readerEvent.target?.result;
      if (typeof result === 'string') {
        onAvatarChange?.(result);
      }
      setAvatarLoading(false);
      event.target.value = '';
    };
    reader.onerror = (): void => {
      const message = 'Không thể đọc file ảnh.';
      setAvatarError(message);
      onToast?.(message);
      setAvatarLoading(false);
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={onSave} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col items-center gap-3 border-b border-slate-100 pb-6">
        <div className="relative h-28 w-28 overflow-hidden rounded-full bg-[var(--color-primary-dark)] text-white ring-4 ring-slate-100">
          {personal.avatarUrl ? (
            <Image src={personal.avatarUrl} alt="Ảnh đại diện của người dùng" fill sizes="112px" className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold">{initials(personal)}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => document.getElementById('avatar-file-input')?.click()}
          aria-label="Tải ảnh đại diện mới lên"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[var(--color-primary-dark)] transition hover:bg-slate-50"
          disabled={avatarLoading}
        >
          {avatarLoading && <LoadingSpinner size="sm" />}
          Tải ảnh mới lên
        </button>
        <input
          id="avatar-file-input"
          type="file"
          accept={ACCEPTED_AVATAR_TYPES.join(',')}
          className="hidden"
          onChange={handleAvatarFile}
          aria-describedby="avatar-help avatar-error"
        />
        <p id="avatar-help" className="text-xs font-medium text-slate-500">JPG, PNG hoặc WebP. Tối đa 2MB.</p>
        {avatarError && <p id="avatar-error" className="text-sm font-semibold text-red-600" role="alert">{avatarError}</p>}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-2">
        <div className="space-y-5">
          <div>
            <label htmlFor="profile-full-name" className="form-label">Họ và tên</label>
            <input
              id="profile-full-name"
              type="text"
              value={`${personal.firstName} ${personal.lastName}`.trim()}
              onChange={(event) => onFullNameChange(event.target.value)}
              className={fieldClass}
              required
            />
          </div>

          <div>
            <div className="form-label">Giới tính</div>
            <div className="grid grid-cols-3 gap-2">
              {['Nam', 'Nữ', 'Khác'].map((gender) => (
                <label key={gender} className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition has-[:checked]:border-[var(--color-primary-dark)] has-[:checked]:bg-[var(--color-primary-lightest)]">
                  <input type="radio" name="gender" value={gender} checked={personal.gender === gender} onChange={onChange} className="h-4 w-4 accent-[var(--color-primary-dark)]" />
                  {gender}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="profile-email" className="form-label">Email</label>
            <input id="profile-email" type="email" name="email" value={personal.email} onChange={onChange} className={fieldClass} required />
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="profile-date-of-birth" className="form-label">Ngày sinh</label>
            <input id="profile-date-of-birth" type="date" name="dateOfBirth" value={personal.dateOfBirth || ''} onChange={onChange} className={fieldClass} />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="profile-phone" className="form-label mb-0">Số điện thoại</label>
              <button type="button" className="text-xs font-semibold text-[var(--color-primary-dark)] hover:underline">Liên kết số điện thoại</button>
            </div>
            <input id="profile-phone" type="text" name="phone" value={personal.phone} onChange={onChange} placeholder="0901 234 567" className={fieldClass} />
          </div>

          <div>
            <label htmlFor="profile-home-city" className="form-label">Địa chỉ</label>
            <input id="profile-home-city" type="text" name="homeCity" value={personal.homeCity || ''} onChange={onChange} placeholder="Hà Nội, Việt Nam" className={fieldClass} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary-dark)] px-10 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--color-primary-darker)] disabled:opacity-60">
          {saving && <LoadingSpinner size="sm" />}
          {saving ? 'ĐANG LƯU...' : 'LƯU CHỈNH SỬA'}
        </button>
      </div>
    </form>
  );
});

PersonalInfoForm.displayName = 'PersonalInfoForm';

export default PersonalInfoForm;

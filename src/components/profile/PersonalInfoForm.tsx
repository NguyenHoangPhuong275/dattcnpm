'use client';

import React, { memo } from 'react';
import Image from 'next/image';
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

const fieldClass = 'w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[var(--color-primary-dark)] focus:ring-4 focus:ring-[var(--color-primary-dark)]/10';

function initials(personal: PersonalInfo) {
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
  onToast
}: PersonalInfoFormProps) => (
  <form onSubmit={onSave} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col items-center gap-3 border-b border-slate-100 pb-6">
      <div className="relative h-28 w-28 overflow-hidden rounded-full bg-[var(--color-primary-dark)] text-white ring-4 ring-slate-100">
        {personal.avatarUrl ? (
          <Image src={personal.avatarUrl} alt="Avatar" fill sizes="112px" className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-bold">{initials(personal)}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => document.getElementById('avatar-file-input')?.click()}
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[var(--color-primary-dark)] transition hover:bg-slate-50"
      >
        Tải ảnh mới lên
      </button>
      <input
        id="avatar-file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (!file.type.startsWith('image/')) {
            onToast?.('Chỉ chấp nhận file ảnh');
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            onToast?.('Ảnh quá lớn, tối đa 5MB');
            return;
          }
          const reader = new FileReader();
          reader.onload = (readerEvent) => {
            const dataUrl = readerEvent.target?.result as string;
            onAvatarChange?.(dataUrl);
          };
          reader.readAsDataURL(file);
        }}
      />
    </div>

    <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-2">
      <div className="space-y-5">
        <div>
          <label className="form-label">Họ và tên</label>
          <input
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
          <label className="form-label">Email</label>
          <input type="email" name="email" value={personal.email} onChange={onChange} className={fieldClass} required />
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="form-label">Ngày sinh</label>
          <input type="date" name="dateOfBirth" value={personal.dateOfBirth || ''} onChange={onChange} className={fieldClass} />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label className="form-label mb-0">Số điện thoại</label>
            <button type="button" className="text-xs font-semibold text-[var(--color-primary-dark)] hover:underline">Liên kết số điện thoại</button>
          </div>
          <input type="text" name="phone" value={personal.phone} onChange={onChange} placeholder="0901 234 567" className={fieldClass} />
        </div>

        <div>
          <label className="form-label">Địa chỉ</label>
          <input type="text" name="homeCity" value={personal.homeCity || ''} onChange={onChange} placeholder="Hà Nội, Việt Nam" className={fieldClass} />
        </div>
      </div>
    </div>

    <div className="mt-8 flex justify-center">
      <button type="submit" disabled={saving} className="rounded-lg bg-[var(--color-primary-dark)] px-10 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--color-primary-darker)] disabled:opacity-60">
        {saving ? 'ĐANG LƯU...' : 'LƯU CHỈNH SỬA'}
      </button>
    </div>
  </form>
));

PersonalInfoForm.displayName = 'PersonalInfoForm';

export default PersonalInfoForm;

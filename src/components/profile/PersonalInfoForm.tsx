'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { PersonalInfo } from '@/types/profile';

export type { PersonalInfo }; 

interface PersonalInfoFormProps {
  personal: PersonalInfo;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSave: (e: React.FormEvent) => void;
  onAvatarChange?: (url: string) => void;
  saving?: boolean;
  onToast?: (msg: string) => void;
}

const PersonalInfoForm = memo(({
  personal,
  onChange,
  onSave,
  onAvatarChange,
  saving,
  onToast
}: PersonalInfoFormProps) => (
  <form onSubmit={onSave} className="space-y-6">
    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
      <div className="h-16 w-16 rounded-2xl bg-[var(--color-primary-dark)] flex items-center justify-center text-2xl font-bold text-white ring-4 ring-[var(--color-primary-dark)/10] overflow-hidden">
        {personal.avatarUrl ? (
          <Image src={personal.avatarUrl} alt="Avatar" width={64} height={64} className="w-full h-full object-cover" unoptimized />
        ) : (
          <span>{personal.firstName?.[0] || 'U'}{personal.lastName?.[0] || ''}</span>
        )}
      </div>
      <div>
        <div className="font-semibold text-lg">{personal.firstName} {personal.lastName}</div>
        <button
          type="button"
          onClick={() => document.getElementById('avatar-file-input')?.click()}
          className="text-xs font-semibold text-[var(--color-primary-dark)] hover:underline mt-0.5"
        >
          Thay đổi ảnh đại diện
        </button>
        <input
          id="avatar-file-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
              onToast?.('Chỉ chấp nhận file ảnh');
              return;
            }
            if (file.size > 5 * 1024 * 1024) {
              onToast?.('Ảnh quá lớn (tối đa 5MB)');
              return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
              const dataUrl = ev.target?.result as string;
              onAvatarChange?.(dataUrl);
            };
            reader.readAsDataURL(file);
          }}
        />
      </div>
    </div>

    <div>
      <div className="form-section-title">Thông tin liên hệ &amp; danh tính</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        <div>
          <label className="form-label">Tên <span className="text-red-500">*</span></label>
          <input type="text" name="firstName" value={personal.firstName} onChange={onChange} className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-[var(--color-primary-dark)] rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-[var(--color-primary-dark)/10]" required />
        </div>
        <div>
          <label className="form-label">Họ và tên đệm <span className="text-red-500">*</span></label>
          <input type="text" name="lastName" value={personal.lastName} onChange={onChange} className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-[var(--color-primary-dark)] rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-[var(--color-primary-dark)/10]" required />
        </div>
        <div>
          <label className="form-label">Email <span className="text-red-500">*</span></label>
          <input type="email" name="email" value={personal.email} onChange={onChange} className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-[var(--color-primary-dark)] rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-[var(--color-primary-dark)/10]" required />
        </div>
        <div>
          <label className="form-label">Số điện thoại</label>
          <input type="text" name="phone" value={personal.phone} onChange={onChange} placeholder="Ví dụ: 0901 234 567" className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-[var(--color-primary-dark)] rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-[var(--color-primary-dark)/10]" />
        </div>
      </div>
    </div>

    <div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Thông tin du lịch cơ bản</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        <div>
          <label className="form-label">Ngày sinh</label>
          <input type="date" name="dateOfBirth" value={personal.dateOfBirth || ''} onChange={onChange} className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-[var(--color-primary-dark)] rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-[var(--color-primary-dark)/10]" />
        </div>
        <div>
          <label className="form-label">Giới tính</label>
          <div className="relative">
            <select
              name="gender"
              value={personal.gender || ''}
              onChange={onChange}
              className="w-full appearance-none bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-[var(--color-primary-dark)] rounded-2xl px-4 py-3 pr-10 text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-[var(--color-primary-dark)/10] cursor-pointer"
            >
              <option value="">Chọn giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        <div>
          <label className="form-label">Quốc tịch</label>
          <input type="text" name="nationality" value={personal.nationality || ''} onChange={onChange} placeholder="Việt Nam" className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-[var(--color-primary-dark)] rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-[var(--color-primary-dark)/10]" />
        </div>
        <div>
          <label className="form-label">Ngôn ngữ ưu tiên</label>
          <div className="relative">
            <select
              name="preferredLanguage"
              value={personal.preferredLanguage || ''}
              onChange={onChange}
              className="w-full appearance-none bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-[var(--color-primary-dark)] rounded-2xl px-4 py-3 pr-10 text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-[var(--color-primary-dark)/10] cursor-pointer"
            >
              <option value="">Chọn ngôn ngữ</option>
              <option value="Tiếng Việt">Tiếng Việt</option>
              <option value="English">English</option>
              <option value="Tiếng Trung">Tiếng Trung</option>
              <option value="Tiếng Nhật">Tiếng Nhật</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        <div>
          <label className="form-label">Thành phố thường trú</label>
          <input type="text" name="homeCity" value={personal.homeCity || ''} onChange={onChange} placeholder="Hà Nội, TP.HCM..." className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-[var(--color-primary-dark)] rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-[var(--color-primary-dark)/10]" />
        </div>
      </div>
    </div>

    <div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Thông tin an toàn (thực tế khi đi du lịch)</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        <div>
          <label className="form-label">Tên liên hệ khẩn cấp</label>
          <input type="text" name="emergencyContactName" value={personal.emergencyContactName || ''} onChange={onChange} placeholder="Nguyễn Văn A" className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-[var(--color-primary-dark)] rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-[var(--color-primary-dark)/10]" />
        </div>
        <div>
          <label className="form-label">SĐT liên hệ khẩn cấp</label>
          <input type="text" name="emergencyContactPhone" value={personal.emergencyContactPhone || ''} onChange={onChange} placeholder="0901 234 567" className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-[var(--color-primary-dark)] rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-[var(--color-primary-dark)/10]" />
        </div>
      </div>
    </div>

    <div className="flex justify-end pt-4 border-t border-slate-100">
      <button type="submit" disabled={saving} className="rounded-2xl bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary-darker)] text-white px-8 py-3 text-sm font-semibold shadow-sm active:scale-[0.985] transition-all disabled:opacity-60">
        {saving ? 'Đang lưu...' : 'Lưu thông tin cá nhân'}
      </button>
    </div>
  </form>
));

PersonalInfoForm.displayName = 'PersonalInfoForm';

export default PersonalInfoForm;

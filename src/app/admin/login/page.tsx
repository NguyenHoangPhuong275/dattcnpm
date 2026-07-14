'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import { ROUTES } from '@/lib/constants';

export default function AdminLoginPage(): React.JSX.Element {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError(getApiErrorMessage(data, 'Không thể đăng nhập. Vui lòng thử lại.'));
        return;
      }
      router.replace(ROUTES.admin);
      router.refresh();
    } catch {
      setError('Không thể kết nối. Vui lòng kiểm tra đường truyền và thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-brand relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--admin-brand-canvas)] px-4 py-10">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[var(--color-primary-light)]/30 blur-3xl" />
      <div className="absolute -bottom-48 -right-24 h-[32rem] w-[32rem] rounded-full bg-[var(--color-primary)]/20 blur-3xl" />
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_30px_90px_rgba(80,32,112,0.16)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-[620px] overflow-hidden bg-[var(--admin-brand-deep)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 top-20 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-8 top-36 h-48 w-48 rounded-full border border-white/10" />
          <div className="relative flex items-center gap-3">
            <div className="rounded-2xl bg-white p-2 shadow-lg">
              <Image src="/images/logo.svg" alt="Biểu trưng Lotus Travel" width={40} height={40} />
            </div>
            <div>
              <p className="font-display text-xl font-extrabold">Lotus Travel</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Trung tâm quản trị</p>
            </div>
          </div>
          <div className="relative">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/45">Khu vực quản trị</p>
            <h2 className="mt-4 max-w-sm font-display text-4xl font-extrabold leading-tight">Vận hành Lotus Travel an toàn và nhất quán.</h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">Quản lý người dùng, nội dung và dịch vụ trên một giao diện tập trung.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex min-h-[560px] flex-col justify-center p-7 sm:p-12 lg:min-h-[620px]">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <Image src="/images/logo.svg" alt="Biểu trưng Lotus Travel" width={48} height={48} />
          <div>
            <p className="font-display text-lg font-extrabold text-[var(--color-text)]">Lotus Travel</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-primary-dark)]">Trung tâm quản trị</p>
          </div>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--color-text)]">Đăng nhập quản trị</h1>
        <label htmlFor="admin-password" className="mt-8 block text-xs font-bold text-[var(--color-text-secondary)]">Mật khẩu quản trị</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="admin-field mt-2"
          placeholder="Nhập mật khẩu"
          required
          autoFocus
        />
        {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button
          id="admin-login-submit"
          type="submit"
          disabled={loading}
          className="admin-button-primary mt-6 w-full !min-h-12"
        >
          {loading ? 'Đang xác thực...' : 'Đăng nhập'}
        </button>
        <p className="mt-6 text-center text-xs leading-5 text-[var(--color-text-muted)]">Khu vực giới hạn. Chỉ quản trị viên được ủy quyền mới có thể truy cập.</p>
        </form>
      </section>
    </main>
  );
}

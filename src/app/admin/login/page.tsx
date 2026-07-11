'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiRequest, getApiErrorMessage } from '@/lib/api-client';

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
        setError(getApiErrorMessage(data, 'Không thể đăng nhập quản trị'));
        return;
      }
      router.replace('/admin');
      router.refresh();
    } catch {
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-white p-8 shadow-[0_10px_45px_rgba(0,0,0,0.06)]">
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-text)]">Đăng nhập quản trị</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Nhập mật khẩu quản trị để mở bảng điều khiển.</p>
        <label htmlFor="admin-password" className="mt-6 block text-sm font-semibold text-[var(--color-text)]">Mật khẩu</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/70 px-4 py-3 text-sm font-medium text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-dark)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary-lightest)]"
          required
          autoFocus
        />
        {error && <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}
        <button
          id="admin-login-submit"
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-[var(--color-primary-darker)] px-4 py-3 font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
        >
          {loading ? 'Đang xác thực...' : 'Đăng nhập'}
        </button>
      </form>
    </main>
  );
}

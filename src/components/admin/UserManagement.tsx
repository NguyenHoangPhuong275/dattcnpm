'use client';

import { useConfirm } from '@/hooks/useConfirm';

export interface AdminUserItem {
  _id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
  isLocked: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface UserManagementProps {
  users: AdminUserItem[];
  query: string;
  status: string;
  page: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  actionLoading: string | null;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onAction: (actionId: string, event: string, payload?: Record<string, unknown>) => void;
  onViewActivity: (user: AdminUserItem) => void;
}

export default function UserManagement({
  users,
  query,
  status,
  page,
  totalPages,
  total,
  isLoading,
  actionLoading,
  onQueryChange,
  onStatusChange,
  onPageChange,
  onAction,
  onViewActivity,
}: UserManagementProps): React.JSX.Element {
  const { confirm } = useConfirm();

  async function handleDelete(user: AdminUserItem): Promise<void> {
    const confirmed = await confirm({
      title: 'Xóa mềm tài khoản?',
      description: `Tài khoản ${user.email} sẽ bị vô hiệu hóa và đăng xuất khỏi các phiên hiện tại.`,
      confirmLabel: 'Xóa tài khoản',
      tone: 'danger',
    });
    if (confirmed) onAction(`delete:${user._id}`, 'user.delete', { email: user.email, hard: false });
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
      <div className="border-b border-[var(--color-border)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--color-text)]">Người dùng</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{total.toLocaleString('vi-VN')} tài khoản đang hoạt động trong hệ thống</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="admin-user-search">Tìm người dùng</label>
            <input
              id="admin-user-search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Tìm tên hoặc email..."
              className="min-w-64 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary-dark)]"
            />
            <label className="sr-only" htmlFor="admin-user-status">Trạng thái</label>
            <select
              id="admin-user-status"
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
              className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Đã khóa</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[var(--color-bg)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            <tr>
              <th className="px-6 py-3">Người dùng</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày tham gia</th>
              <th className="px-6 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-[var(--color-text-muted)]">Đang tải người dùng...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-[var(--color-text-muted)]">Không tìm thấy người dùng phù hợp.</td></tr>
            ) : users.map((user) => (
              <tr key={user._id} className="hover:bg-[var(--color-bg)]/60">
                <td className="px-6 py-4">
                  <p className="font-bold text-[var(--color-text)]">{user.fullName || 'Chưa cập nhật tên'}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{user.email}</p>
                </td>
                <td className="px-4 py-4"><span className="rounded-full bg-[var(--color-primary-lightest)] px-2.5 py-1 text-xs font-bold text-[var(--color-primary-darker)]">{user.role}</span></td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.isLocked ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {user.isLocked ? 'Đã khóa' : 'Hoạt động'}
                  </span>
                </td>
                <td className="px-4 py-4 text-[var(--color-text-secondary)]">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button id={`admin-user-activity-${user._id}`} type="button" onClick={() => onViewActivity(user)} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold hover:bg-[var(--color-bg)]">Hoạt động</button>
                    <button
                      id={`admin-user-lock-${user._id}`}
                      type="button"
                      disabled={actionLoading !== null || user.role === 'ADMIN'}
                      onClick={() => onAction(`lock:${user._id}`, user.isLocked ? 'user.unlock' : 'user.lock', { email: user.email })}
                      className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700 disabled:opacity-40"
                    >
                      {actionLoading === `lock:${user._id}` ? 'Đang xử lý...' : user.isLocked ? 'Mở khóa' : 'Khóa'}
                    </button>
                    <button id={`admin-user-delete-${user._id}`} type="button" disabled={actionLoading !== null || user.role === 'ADMIN'} onClick={() => handleDelete(user)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-40">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] px-6 py-4 text-sm">
        <span className="text-[var(--color-text-muted)]">Trang {page}/{Math.max(totalPages, 1)}</span>
        <div className="flex gap-2">
          <button id="admin-users-prev" type="button" disabled={page <= 1 || isLoading} onClick={() => onPageChange(page - 1)} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 disabled:opacity-40">Trước</button>
          <button id="admin-users-next" type="button" disabled={page >= totalPages || isLoading} onClick={() => onPageChange(page + 1)} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 disabled:opacity-40">Sau</button>
        </div>
      </div>
    </section>
  );
}

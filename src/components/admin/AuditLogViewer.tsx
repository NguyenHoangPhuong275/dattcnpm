'use client';

export interface AdminAuditLog {
  _id: string;
  userId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actor?: { id: string; email: string; fullName: string } | null;
}

interface AuditLogViewerProps {
  logs: AdminAuditLog[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  actionFilter: string;
  selectedUserLabel?: string;
  onActionFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onClearUser: () => void;
  onRefresh: () => void;
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Đăng nhập', REGISTER: 'Đăng ký', CREATE_TRIP: 'Tạo chuyến đi', UPDATE_TRIP: 'Sửa chuyến đi',
  DELETE_TRIP: 'Xóa chuyến đi', LOCK_USER: 'Khóa người dùng', UNLOCK_USER: 'Mở khóa người dùng',
  CREATE_REVIEW: 'Tạo đánh giá', UPDATE_REVIEW: 'Sửa đánh giá', DELETE_REVIEW: 'Xóa đánh giá',
  RESET_PASSWORD: 'Đặt lại mật khẩu', UPDATE_PREFERENCES: 'Sửa sở thích',
};

export default function AuditLogViewer(props: AuditLogViewerProps): React.JSX.Element {
  const actions = [...new Set(props.logs.map((log) => log.action))].sort();
  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--color-text)]">Nhật ký hoạt động</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{props.total.toLocaleString('vi-VN')} hành động đã được lưu trong MongoDB</p>
        </div>
        <div className="flex gap-2">
          <select id="admin-log-action" value={props.actionFilter} onChange={(event) => props.onActionFilterChange(event.target.value)} className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm">
            <option value="">Tất cả hành động</option>
            {actions.map((action) => <option key={action} value={action}>{ACTION_LABELS[action] ?? action}</option>)}
          </select>
          <button id="admin-logs-refresh" type="button" onClick={props.onRefresh} className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-bold">Tải lại</button>
        </div>
      </div>
      {props.selectedUserLabel && (
        <div className="mx-6 mt-4 flex items-center justify-between rounded-xl bg-[var(--color-primary-lightest)] px-4 py-2 text-sm text-[var(--color-primary-darker)]">
          <span>Đang xem hoạt động của <strong>{props.selectedUserLabel}</strong></span>
          <button id="admin-clear-user-filter" type="button" onClick={props.onClearUser} className="font-bold">Bỏ lọc</button>
        </div>
      )}
      <div className="divide-y divide-[var(--color-border)] px-6">
        {props.isLoading ? <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">Đang tải nhật ký...</p>
          : props.logs.length === 0 ? <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">Không có hoạt động phù hợp.</p>
          : props.logs.map((log) => {
            const date = new Date(log.createdAt);
            const actorName = log.actor?.fullName || String(log.metadata?.email ?? 'Hệ thống');
            const actorEmail = log.actor?.email;
            return (
              <article key={log._id} className="grid gap-3 py-4 sm:grid-cols-[180px_1fr_auto] sm:items-start">
                <time className="text-xs text-[var(--color-text-muted)]" dateTime={log.createdAt}>{date.toLocaleString('vi-VN')}</time>
                <div>
                  <p className="font-bold text-[var(--color-text)]">{ACTION_LABELS[log.action] ?? log.action}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{actorName}{actorEmail ? ` · ${actorEmail}` : ''}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">Đối tượng: {log.targetType}{log.targetId ? ` · ${log.targetId}` : ''}</p>
                </div>
                <span className="w-fit rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-xs font-bold text-[var(--color-text-secondary)]">{log.action}</span>
              </article>
            );
          })}
      </div>
      <div className="flex items-center justify-between border-t border-[var(--color-border)] px-6 py-4 text-sm">
        <span className="text-[var(--color-text-muted)]">Trang {props.page}/{Math.max(props.totalPages, 1)}</span>
        <div className="flex gap-2">
          <button id="admin-logs-prev" type="button" disabled={props.page <= 1 || props.isLoading} onClick={() => props.onPageChange(props.page - 1)} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 disabled:opacity-40">Trước</button>
          <button id="admin-logs-next" type="button" disabled={props.page >= props.totalPages || props.isLoading} onClick={() => props.onPageChange(props.page + 1)} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 disabled:opacity-40">Sau</button>
        </div>
      </div>
    </section>
  );
}

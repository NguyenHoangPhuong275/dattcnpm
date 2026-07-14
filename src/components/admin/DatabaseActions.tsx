'use client';

interface DatabaseActionsProps {
  onDbAction: (action: 'db.reset' | 'db.clear' | 'db.check' | 'db.createTables') => void;
  actionLoading: string | null;
}

export default function DatabaseActions({ onDbAction, actionLoading }: DatabaseActionsProps) {
  return (
    <section className="admin-surface overflow-hidden">
      <div className="border-b border-black/[0.055] px-6 py-5 sm:px-7">
        <h2 className="text-lg font-extrabold text-[var(--color-text)]">Bảo trì dữ liệu</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Kiểm tra hoặc khôi phục dữ liệu của Lotus Travel.</p>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-7">
        <button
          id="admin-db-check"
          type="button"
          onClick={() => onDbAction('db.check')}
          disabled={actionLoading !== null}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left transition hover:border-emerald-300 hover:bg-emerald-100/70 disabled:opacity-50"
        >
          <span className="text-sm font-extrabold text-emerald-800">{actionLoading === 'db.check' ? 'Đang kiểm tra...' : 'Kiểm tra cơ sở dữ liệu'}</span>
          <span className="mt-2 block text-xs leading-5 text-emerald-700/75">Kiểm tra cấu trúc và đảm bảo tính nhất quán của dữ liệu hệ thống.</span>
        </button>
        <button
          id="admin-db-create-tables"
          type="button"
          onClick={() => onDbAction('db.createTables')}
          disabled={actionLoading !== null}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-lightest)] p-5 text-left transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-primary-light)]/35 disabled:opacity-50"
        >
          <span className="text-sm font-extrabold text-[var(--color-primary-darker)]">{actionLoading === 'db.createTables' ? 'Đang khôi phục...' : 'Khôi phục cấu trúc dữ liệu'}</span>
          <span className="mt-2 block text-xs leading-5 text-[var(--color-primary-dark)]">Bổ sung các bảng dữ liệu còn thiếu mà không làm ảnh hưởng đến dữ liệu hiện có.</span>
        </button>
        <button
          id="admin-db-reset"
          type="button"
          onClick={() => onDbAction('db.reset')}
          disabled={actionLoading !== null}
          className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left transition hover:border-amber-300 hover:bg-amber-100/70 disabled:opacity-50"
        >
          <span className="text-sm font-extrabold text-amber-800">{actionLoading === 'db.reset' ? 'Đang xử lý...' : 'Đặt lại dữ liệu hệ thống'}</span>
          <span className="mt-2 block text-xs leading-5 text-amber-700/75">Xóa sạch toàn bộ dữ liệu người dùng để thiết lập lại hệ thống từ đầu.</span>
        </button>
        <button
          id="admin-db-clear"
          type="button"
          onClick={() => onDbAction('db.clear')}
          disabled={actionLoading !== null}
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-left transition hover:border-red-300 hover:bg-red-100/70 disabled:opacity-50"
        >
          <span className="text-sm font-extrabold text-red-800">{actionLoading === 'db.clear' ? 'Đang xóa...' : 'Xóa sạch cơ sở dữ liệu'}</span>
          <span className="mt-2 block text-xs leading-5 text-red-700/75">Xóa vĩnh viễn tất cả tài khoản, chuyến đi và đặt chỗ. Cần sao lưu trước khi thực hiện.</span>
        </button>
      </div>
    </section>
  );
}

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
  LOGIN: 'Đăng nhập',
  REGISTER: 'Đăng ký tài khoản',
  SEND_OTP: 'Gửi mã xác minh',
  FORGOT_PASSWORD: 'Yêu cầu khôi phục mật khẩu',
  RESET_PASSWORD: 'Đặt lại mật khẩu',
  UPDATE_PREFERENCES: 'Cập nhật sở thích du lịch',
  LOCK_USER: 'Khóa tài khoản',
  UNLOCK_USER: 'Mở khóa tài khoản',
  SOFT_DELETE_USER: 'Vô hiệu hóa tài khoản',
  HARD_DELETE_USER: 'Xóa vĩnh viễn tài khoản',
  CREATE_TRIP: 'Tạo chuyến đi',
  UPDATE_TRIP: 'Cập nhật chuyến đi',
  DELETE_TRIP: 'Xóa chuyến đi',
  ADD_COLLABORATOR: 'Thêm cộng tác viên',
  REMOVE_COLLABORATOR: 'Xóa cộng tác viên',
  CREATE_ITINERARY_ITEM: 'Thêm hoạt động vào lịch trình',
  UPDATE_ITINERARY_ITEM: 'Cập nhật hoạt động lịch trình',
  DELETE_ITINERARY_ITEM: 'Xóa hoạt động khỏi lịch trình',
  REORDER_ITINERARY: 'Sắp xếp lại lịch trình',
  CREATE_BUDGET: 'Thêm khoản chi',
  UPDATE_BUDGET: 'Cập nhật khoản chi',
  DELETE_BUDGET: 'Xóa khoản chi',
  CREATE_ACCOMMODATION: 'Thêm nơi lưu trú',
  UPDATE_ACCOMMODATION: 'Cập nhật nơi lưu trú',
  DELETE_ACCOMMODATION: 'Xóa nơi lưu trú',
  CREATE_CHECKLIST_ITEM: 'Thêm mục chuẩn bị',
  UPDATE_CHECKLIST_ITEM: 'Cập nhật mục chuẩn bị',
  DELETE_CHECKLIST_ITEM: 'Xóa mục chuẩn bị',
  BULK_ADD_CHECKLIST: 'Thêm danh sách chuẩn bị từ mẫu',
  CREATE_REVIEW: 'Đăng đánh giá địa điểm',
  UPDATE_REVIEW: 'Cập nhật đánh giá địa điểm',
  DELETE_REVIEW: 'Xóa đánh giá địa điểm',
  REPORT_REVIEW: 'Báo cáo đánh giá',
  RESOLVE_REVIEW_REPORT: 'Xử lý báo cáo đánh giá',
  CREATE_HOTEL_REVIEW: 'Đăng đánh giá khách sạn',
  UPDATE_HOTEL_REVIEW: 'Cập nhật đánh giá khách sạn',
  DELETE_HOTEL_REVIEW: 'Xóa đánh giá khách sạn',
  CREATE_HOTEL_BOOKING: 'Gửi yêu cầu đặt phòng',
  PAY_HOTEL_BOOKING: 'Thanh toán đơn đặt phòng',
  CONFIRM_HOTEL_BOOKING: 'Xác nhận đơn đặt phòng',
  CANCEL_HOTEL_BOOKING: 'Hủy đơn đặt phòng',
  CREATE_FLIGHT_BOOKING: 'Đặt vé máy bay',
  PAY_FLIGHT_BOOKING: 'Thanh toán vé máy bay',
  SEED_VN_ADMIN: 'Cập nhật danh mục địa phương',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  USER: 'Tài khoản',
  OTP: 'Mã xác minh',
  LOCATION: 'Dữ liệu địa điểm',
  TRIP: 'Chuyến đi',
  ITINERARY_ITEM: 'Hoạt động lịch trình',
  TRIP_BUDGET: 'Khoản chi',
  TRIP_ACCOMMODATION: 'Nơi lưu trú',
  TRIP_CHECKLIST: 'Danh sách chuẩn bị',
  REVIEW: 'Đánh giá địa điểm',
  REVIEW_REPORT: 'Báo cáo đánh giá',
  HOTEL_REVIEW: 'Đánh giá khách sạn',
  HOTEL_BOOKING: 'Đơn đặt phòng',
  FLIGHT_BOOKING: 'Đơn đặt vé máy bay',
};

export function getAuditActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? 'Hoạt động hệ thống';
}

export function getAuditTargetLabel(targetType: string): string {
  return TARGET_TYPE_LABELS[targetType] ?? 'Dữ liệu hệ thống';
}

export default function AuditLogViewer(props: AuditLogViewerProps): React.JSX.Element {
  const actions = [...new Set(props.logs.map((log) => log.action))].sort();
  return (
    <section className="admin-surface overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-black/[0.055] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--color-text)]">{props.total.toLocaleString('vi-VN')} sự kiện đã ghi nhận</h2>
        </div>
        <div className="flex min-w-0 flex-col gap-2 md:flex-row">
          <select id="admin-log-action" value={props.actionFilter} onChange={(event) => props.onActionFilterChange(event.target.value)} className="admin-field app-select min-w-0 md:w-auto md:min-w-48">
            <option value="">Tất cả hành động</option>
            {actions.map((action) => <option key={action} value={action}>{getAuditActionLabel(action)}</option>)}
          </select>
          <button id="admin-logs-refresh" type="button" onClick={props.onRefresh} className="admin-button-secondary">Làm mới</button>
        </div>
      </div>
      {props.selectedUserLabel && (
        <div className="mx-6 mt-4 flex items-center justify-between rounded-xl bg-[var(--color-primary-lightest)] px-4 py-2 text-sm text-[var(--color-primary-darker)]">
          <span>Đang xem hoạt động của <strong>{props.selectedUserLabel}</strong></span>
          <button id="admin-clear-user-filter" type="button" onClick={props.onClearUser} className="font-bold">Xóa bộ lọc</button>
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
              <article key={log._id} className="grid gap-3 py-4 sm:grid-cols-[180px_1fr] sm:items-start">
                <time className="text-xs text-[var(--color-text-muted)]" dateTime={log.createdAt}>{date.toLocaleString('vi-VN')}</time>
                <div>
                  <p className="font-bold text-[var(--color-text)]">{getAuditActionLabel(log.action)}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{actorName}{actorEmail ? ` · ${actorEmail}` : ''}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">Đối tượng: {getAuditTargetLabel(log.targetType)}</p>
                </div>
              </article>
            );
          })}
      </div>
      <div className="flex items-center justify-between border-t border-black/[0.055] bg-[#fdfcfc] px-6 py-4 text-sm">
        <span className="text-[var(--color-text-muted)]">Trang {props.page}/{Math.max(props.totalPages, 1)}</span>
        <div className="flex gap-2">
          <button id="admin-logs-prev" type="button" disabled={props.page <= 1 || props.isLoading} onClick={() => props.onPageChange(props.page - 1)} className="admin-button-secondary !min-h-9 !px-3">Trang trước</button>
          <button id="admin-logs-next" type="button" disabled={props.page >= props.totalPages || props.isLoading} onClick={() => props.onPageChange(props.page + 1)} className="admin-button-secondary !min-h-9 !px-3">Trang sau</button>
        </div>
      </div>
    </section>
  );
}

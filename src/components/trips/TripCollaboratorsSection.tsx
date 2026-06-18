'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type Permission = 'READ' | 'EDIT';

interface Collaborator {
  userId: string;
  permission: Permission;
  invitedAt?: string | null;
  acceptedAt?: string | null;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

interface ShareData {
  shareCode: string;
  shareUrl: string;
  expiresAt: string;
}

interface TripCollaboratorsSectionProps {
  tripId: string;
  userId: string | null;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const PERMISSION_LABELS: Record<Permission, string> = {
  READ: 'Chỉ xem',
  EDIT: 'Chỉnh sửa',
};

function shortUserId(value: string): string {
  return value.length > 6 ? `Người dùng …${value.slice(-6)}` : `Người dùng ${value}`;
}

export default function TripCollaboratorsSection({ tripId, userId }: TripCollaboratorsSectionProps): React.JSX.Element {
  const [status, setStatus] = useState<Status>('idle');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<Permission>('READ');
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [share, setShare] = useState<ShareData | null>(null);
  const [sharing, setSharing] = useState(false);
  const { actions: { showToast } } = useToast();

  const load = useCallback(async (): Promise<void> => {
    if (!userId) return;
    setStatus('loading');
    setErrorMessage('');
    try {
      const { response, data } = await apiRequest<ApiResponse<Collaborator[]>>(`/api/trips/${tripId}/collaborators`, { userId });
      try {
        ensureApiSuccess(response, data, 'Không thể tải cộng tác viên');
      } catch {
        setErrorMessage(getApiErrorMessage(data, 'Không thể tải cộng tác viên'));
        setStatus('error');
        return;
      }
      setCollaborators(Array.isArray(data.data) ? data.data : []);
      setStatus('success');
    } catch {
      setErrorMessage('Không thể tải cộng tác viên');
      setStatus('error');
    }
  }, [tripId, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async (): Promise<void> => {
    const trimmed = email.trim();
    if (!userId || !trimmed || inviting) return;
    setInviting(true);
    try {
      const { response, data } = await apiRequest<ApiResponse<unknown>>(`/api/trips/${tripId}/collaborators`, {
        method: 'POST',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, permission }),
      });
      try {
        ensureApiSuccess(response, data, 'Không thể mời cộng tác viên');
      } catch {
        showToast(getApiErrorMessage(data, 'Không thể mời cộng tác viên'), 'error');
        return;
      }
      setEmail('');
      showToast('Đã thêm cộng tác viên', 'success');
      await load();
    } catch {
      showToast('Không thể mời cộng tác viên', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (collaboratorId: string): Promise<void> => {
    if (!userId || removingId) return;
    setRemovingId(collaboratorId);
    try {
      const { response, data } = await apiRequest<ApiResponse<unknown>>(`/api/trips/${tripId}/collaborators/${collaboratorId}`, {
        method: 'DELETE',
        userId,
      });
      try {
        ensureApiSuccess(response, data, 'Không thể xóa cộng tác viên');
      } catch {
        showToast(getApiErrorMessage(data, 'Không thể xóa cộng tác viên'), 'error');
        return;
      }
      setCollaborators((prev) => prev.filter((c) => c.userId !== collaboratorId));
      showToast('Đã xóa cộng tác viên', 'success');
    } catch {
      showToast('Không thể xóa cộng tác viên', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const handleCreateShare = async (): Promise<void> => {
    if (!userId || sharing) return;
    setSharing(true);
    try {
      const { response, data } = await apiRequest<ApiResponse<ShareData>>(`/api/trips/${tripId}/share`, {
        method: 'POST',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      try {
        ensureApiSuccess(response, data, 'Không thể tạo liên kết chia sẻ');
      } catch {
        showToast(getApiErrorMessage(data, 'Không thể tạo liên kết chia sẻ'), 'error');
        return;
      }
      if (data.data) {
        setShare(data.data);
        showToast('Đã tạo liên kết chia sẻ', 'success');
      }
    } catch {
      showToast('Không thể tạo liên kết chia sẻ', 'error');
    } finally {
      setSharing(false);
    }
  };

  const handleRevokeShare = async (): Promise<void> => {
    if (!userId || sharing) return;
    setSharing(true);
    try {
      const { response, data } = await apiRequest<ApiResponse<unknown>>(`/api/trips/${tripId}/share`, {
        method: 'DELETE',
        userId,
      });
      try {
        ensureApiSuccess(response, data, 'Không thể thu hồi liên kết');
      } catch {
        showToast(getApiErrorMessage(data, 'Không thể thu hồi liên kết'), 'error');
        return;
      }
      setShare(null);
      showToast('Đã thu hồi liên kết chia sẻ', 'success');
    } catch {
      showToast('Không thể thu hồi liên kết', 'error');
    } finally {
      setSharing(false);
    }
  };

  const handleCopyShare = async (): Promise<void> => {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${share.shareUrl}`);
      showToast('Đã sao chép liên kết', 'success');
    } catch {
      showToast('Không thể sao chép liên kết', 'error');
    }
  };

  return (
    <div className="border-t border-[var(--color-border)] pt-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm text-[var(--color-text)]">Cộng tác viên</div>
        {status === 'loading' && <LoadingSpinner size="sm" className="text-[var(--color-primary-dark)]" />}
      </div>

      {status === 'error' && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-3 py-2">
          <span className="text-sm text-[var(--color-danger)]">{errorMessage || 'Không thể tải cộng tác viên'}</span>
          <button type="button" onClick={load} className="shrink-0 text-xs font-semibold text-[var(--color-primary-darker)] hover:underline">
            Thử lại
          </button>
        </div>
      )}

      {status === 'success' && (
        <>
          <div className="space-y-2 mb-3">
            {collaborators.length === 0 ? (
              <div className="text-sm text-[var(--color-text-muted)]">Chưa có cộng tác viên nào.</div>
            ) : collaborators.map((collaborator) => (
              <div key={collaborator.userId} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-[var(--color-text)]">{shortUserId(collaborator.userId)}</div>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <span className="rounded-full bg-[var(--color-primary-lightest)] px-2 py-0.5 font-semibold text-[var(--color-primary-darker)]">
                      {PERMISSION_LABELS[collaborator.permission]}
                    </span>
                    <span>{collaborator.acceptedAt ? 'Đã tham gia' : 'Đang chờ'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(collaborator.userId)}
                  disabled={removingId === collaborator.userId}
                  className="shrink-0 text-xs text-[var(--color-danger)] hover:underline disabled:opacity-50"
                >
                  {removingId === collaborator.userId ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email người được mời"
              className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-white"
            />
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as Permission)}
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-white"
              aria-label="Quyền cộng tác viên"
            >
              <option value="READ">Chỉ xem</option>
              <option value="EDIT">Chỉnh sửa</option>
            </select>
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviting || !email.trim()}
              className="text-sm px-4 py-2 rounded-lg bg-[var(--color-primary-darker)] hover:bg-[var(--color-primary-hover)] text-white disabled:opacity-50"
            >
              {inviting ? 'Đang mời...' : 'Mời'}
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-[var(--color-border)] px-3 py-3">
            <div className="mb-2 text-xs font-semibold text-[var(--color-text-secondary)]">Liên kết chia sẻ (chỉ xem)</div>
            {share ? (
              <div className="space-y-2">
                <div className="break-all rounded-md bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-text)]">
                  {`${share.shareUrl}`}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleCopyShare} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-primary-darker)] hover:bg-[var(--color-primary-lightest)]">
                    Sao chép
                  </button>
                  <button type="button" onClick={handleRevokeShare} disabled={sharing} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-danger)]/20 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 disabled:opacity-50">
                    {sharing ? 'Đang thu hồi...' : 'Thu hồi'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCreateShare}
                disabled={sharing}
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-primary-darker)] hover:bg-[var(--color-primary-lightest)] disabled:opacity-50"
              >
                {sharing ? 'Đang tạo...' : 'Tạo liên kết chia sẻ'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

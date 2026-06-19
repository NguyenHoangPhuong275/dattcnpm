'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import ChecklistProgressBar from '@/components/trips/ChecklistProgressBar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { CHECKLIST_TEMPLATES } from '@/data/checklist-templates';

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string | null;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

interface TripChecklistSectionProps {
  tripId: string;
  userId: string | null;
}

export default function TripChecklistSection({ tripId, userId }: TripChecklistSectionProps): React.JSX.Element {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const { actions: { showToast } } = useToast();

  const load = useCallback(async (): Promise<void> => {
    if (!userId) return;
    setLoading(true);
    try {
      const { response, data } = await apiRequest<ApiResponse<ChecklistItem[]>>(`/api/trips/${tripId}/checklist`, { userId });
      try {
        ensureApiSuccess(response, data, 'Không thể tải checklist');
      } catch {
        showToast(getApiErrorMessage(data, 'Không thể tải checklist'), 'error');
        return;
      }
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch {
      showToast('Không thể tải checklist', 'error');
    } finally {
      setLoading(false);
    }
  }, [tripId, userId, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (): Promise<void> => {
    const title = newTitle.trim();
    if (!userId || !title || adding) return;
    setAdding(true);
    try {
      const { response, data } = await apiRequest<ApiResponse<ChecklistItem>>(`/api/trips/${tripId}/checklist`, {
        method: 'POST',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      try {
        ensureApiSuccess(response, data, 'Không thể thêm mục');
      } catch {
        showToast(getApiErrorMessage(data, 'Không thể thêm mục'), 'error');
        return;
      }
      setNewTitle('');
      await load();
    } catch {
      showToast('Không thể thêm mục', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleApplyTemplate = async (templateId: string): Promise<void> => {
    if (!userId || applyingId) return;
    setApplyingId(templateId);
    try {
      const { response, data } = await apiRequest<ApiResponse<{ added: number; skipped: number }>>(
        `/api/trips/${tripId}/checklist/bulk`,
        {
          method: 'POST',
          userId,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId }),
        },
      );
      try {
        ensureApiSuccess(response, data, 'Không thể áp dụng bản mẫu');
      } catch {
        showToast(getApiErrorMessage(data, 'Không thể áp dụng bản mẫu'), 'error');
        return;
      }
      const added = data.data?.added ?? 0;
      const skipped = data.data?.skipped ?? 0;
      if (added > 0) {
        showToast(`Đã thêm ${added} mục${skipped > 0 ? `, bỏ qua ${skipped} mục trùng` : ''}.`, 'success');
      } else {
        showToast('Tất cả mục trong bản mẫu đã có sẵn.', 'info');
      }
      setShowTemplates(false);
      await load();
    } catch {
      showToast('Không thể áp dụng bản mẫu', 'error');
    } finally {
      setApplyingId(null);
    }
  };

  const handleToggle = async (item: ChecklistItem): Promise<void> => {
    if (!userId || busyId) return;
    setBusyId(item.id);
    try {
      const { response, data } = await apiRequest<ApiResponse<ChecklistItem>>(`/api/trips/${tripId}/checklist/${item.id}`, {
        method: 'PATCH',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !item.completed }),
      });
      try {
        ensureApiSuccess(response, data, 'Không thể cập nhật');
      } catch {
        showToast(getApiErrorMessage(data, 'Không thể cập nhật'), 'error');
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i)));
    } catch {
      showToast('Không thể cập nhật', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: ChecklistItem): Promise<void> => {
    if (!userId || busyId) return;
    setBusyId(item.id);
    try {
      const { response, data } = await apiRequest<ApiResponse<unknown>>(`/api/trips/${tripId}/checklist/${item.id}`, {
        method: 'DELETE',
        userId,
      });
      try {
        ensureApiSuccess(response, data, 'Không thể xóa mục');
      } catch {
        showToast(getApiErrorMessage(data, 'Không thể xóa mục'), 'error');
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {
      showToast('Không thể xóa mục', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="border-t border-[var(--color-border)] pt-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm text-[var(--color-text)]">Chuẩn bị</div>
        <div className="flex items-center gap-2">
          {loading && <LoadingSpinner size="sm" className="text-[var(--color-primary-dark)]" />}
          {userId && (
            <button
              type="button"
              onClick={() => setShowTemplates((prev) => !prev)}
              aria-expanded={showTemplates}
              className="text-xs font-semibold text-[var(--color-primary-darker)] hover:underline"
            >
              {showTemplates ? 'Đóng bản mẫu' : 'Áp dụng bản mẫu'}
            </button>
          )}
        </div>
      </div>

      {showTemplates && (
        <div className="mb-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <div className="mb-2 text-xs text-[var(--color-text-muted)]">
            Chọn loại chuyến đi để nạp nhanh danh sách chuẩn bị (mục trùng sẽ được bỏ qua):
          </div>
          <div className="flex flex-wrap gap-2">
            {CHECKLIST_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleApplyTemplate(template.id)}
                disabled={applyingId !== null}
                title={template.description}
                className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:border-[var(--color-primary-darker)] disabled:opacity-50"
              >
                <span aria-hidden="true">{template.icon}</span> {template.name}
                {applyingId === template.id ? ' (đang thêm...)' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3">
        <ChecklistProgressBar items={items} />
      </div>

      <div className="space-y-2 mb-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] px-3 py-2">
            <input
              type="checkbox"
              checked={item.completed}
              disabled={busyId === item.id}
              onChange={() => handleToggle(item)}
              aria-label={`Đánh dấu hoàn thành: ${item.title}`}
              className="h-4 w-4 rounded"
            />
            <span className={`flex-1 break-words text-sm ${item.completed ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}>
              {item.title}
            </span>
            <button
              type="button"
              onClick={() => handleDelete(item)}
              disabled={busyId === item.id}
              className="text-xs text-[var(--color-danger)] hover:underline disabled:opacity-50"
            >
              Xóa
            </button>
          </div>
        ))}
        {items.length === 0 && !loading && (
          <div className="text-sm text-[var(--color-text-muted)]">Chưa có mục nào. Thêm việc cần chuẩn bị cho chuyến đi.</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder="Thêm mục cần chuẩn bị..."
          className="flex-1 border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-white"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !newTitle.trim()}
          className="text-sm px-4 py-2 rounded-lg bg-[var(--color-primary-darker)] hover:bg-[var(--color-primary-hover)] text-white disabled:opacity-50"
        >
          {adding ? 'Đang thêm...' : 'Thêm'}
        </button>
      </div>
    </div>
  );
}

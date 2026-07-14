'use client';

interface AdminAlertProps {
  alert: { message: string; type: 'success' | 'error' } | null;
}

export default function AdminAlert({ alert }: AdminAlertProps) {
  if (!alert) return null;

  return (
    <div
      role={alert.type === 'error' ? 'alert' : 'status'}
      className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition-all animate-fade-in-up ${
        alert.type === 'success'
          ? 'border-[var(--color-success)]/40 bg-[var(--color-success)]/10 text-emerald-700'
          : 'border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-red-700'
      }`}
    >
      {alert.type === 'success' ? (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )}
      <span className="font-semibold text-sm">{alert.message}</span>
    </div>
  );
}

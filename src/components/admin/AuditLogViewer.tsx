'use client';

import React from 'react';

interface AuditLog {
  _id: string;
  userId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditLogViewerProps {
  logs: AuditLog[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function AuditLogViewer({ logs, isLoading, onRefresh }: AuditLogViewerProps) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-lg shadow-slate-950/35 flex flex-col h-full max-h-[740px]">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4 flex-shrink-0">
        <h2 className="text-lg font-bold text-indigo-300 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Nhật ký Hệ thống (Logs)
        </h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-40"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {isLoading && logs.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-slate-800/40 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-slate-600 text-sm">
            Không có bản ghi nhật ký nào.
          </div>
        ) : (
          <div className="relative pl-4 border-l border-slate-800 space-y-6">
            {logs.map((log) => {
              let actionColor = 'bg-slate-800 text-slate-300';
              if (log.action.includes('LOCK')) actionColor = 'bg-amber-950/50 text-amber-400 border-amber-500/20 border';
              else if (log.action.includes('REGISTER')) actionColor = 'bg-emerald-950/50 text-emerald-400 border-emerald-500/20 border';
              else if (log.action.includes('DELETE')) actionColor = 'bg-rose-950/50 text-rose-400 border-rose-500/20 border';

              const date = new Date(log.createdAt);
              const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div key={log._id} className="relative group">
                  <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-700 group-hover:bg-indigo-500 transition-colors border border-slate-900" />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${actionColor}`}>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">{timeStr}</span>
                    </div>
                    <p className="text-xs text-slate-300 break-words pl-0.5">
                      {String(log.metadata?.email ?? log.metadata?.method ?? log.targetType ?? 'Hành động hệ thống')}
                    </p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="text-[9px] text-slate-500 bg-slate-950/40 p-1.5 rounded-lg overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

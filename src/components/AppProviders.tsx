'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import AppToast from '@/components/ui/AppToast';
import AppConfirmDialog from '@/components/ui/AppConfirmDialog';
import { ConfirmContext, type ConfirmOptions } from '@/hooks/useConfirm';
import { ToastContext, useToastController } from '@/hooks/useToast';

export default function AppProviders({ children }: { children: React.ReactNode }): React.JSX.Element {
  const toast = useToastController();
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const confirmResolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const closeConfirm = useCallback((confirmed: boolean): void => {
    confirmResolverRef.current?.(confirmed);
    confirmResolverRef.current = null;
    setConfirmOptions(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    confirmResolverRef.current?.(false);
    setConfirmOptions(options);

    return new Promise<boolean>((resolve) => {
      confirmResolverRef.current = resolve;
    });
  }, []);

  const confirmValue = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirmValue}>
        {children}
        <AppToast
          message={toast.data.message}
          title={toast.data.title}
          type={toast.data.type}
          variant={toast.data.variant}
          visible={toast.status !== 'idle'}
          leaving={toast.status === 'hiding'}
          onClose={toast.actions.hideToast}
        />
        <AppConfirmDialog
          open={!!confirmOptions}
          options={confirmOptions}
          onConfirm={() => closeConfirm(true)}
          onCancel={() => closeConfirm(false)}
        />
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

'use client';

import { useCallback, useMemo } from 'react';
import { useConfirm, type ConfirmOptions } from '@/hooks/useConfirm';
import { useToast, type ToastType } from '@/hooks/useToast';

type ActionMessages = {
  success?: string;
  error: string;
  errorType?: ToastType;
};

type RunActionOptions<T> = ActionMessages & {
  action: () => Promise<T>;
};

type ConfirmActionOptions<T> = RunActionOptions<T> & {
  confirm: ConfirmOptions;
};

function resolveErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useFeedback() {
  const { confirm } = useConfirm();
  const { actions: { showToast } } = useToast();

  const runAction = useCallback(async <T,>({
    action,
    success,
    error,
    errorType = 'error',
  }: RunActionOptions<T>): Promise<T> => {
    try {
      const result = await action();
      if (success) showToast(success, 'success');
      return result;
    } catch (caughtError: unknown) {
      showToast(resolveErrorMessage(caughtError, error), errorType);
      throw caughtError;
    }
  }, [showToast]);

  const confirmAction = useCallback(async <T,>({
    confirm: confirmOptions,
    action,
    success,
    error,
    errorType,
  }: ConfirmActionOptions<T>): Promise<T | null> => {
    const confirmed = await confirm(confirmOptions);
    if (!confirmed) return null;

    return runAction({ action, success, error, errorType });
  }, [confirm, runAction]);

  const actions = useMemo(() => ({
    runAction,
    confirmAction,
  }), [confirmAction, runAction]);

  return { actions };
}

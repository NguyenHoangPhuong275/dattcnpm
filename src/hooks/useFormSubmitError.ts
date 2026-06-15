'use client';

import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';

type SaveResult = {
  success: boolean;
  error?: string;
};

type FormSaveHandler = (event: FormEvent) => Promise<SaveResult> | SaveResult | void;

export function useFormSubmitError(
  onSave: FormSaveHandler,
  fallbackMessage: string
): {
  formError: string | null;
  handleSubmit: (event: FormEvent) => Promise<void>;
} {
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setFormError(null);

    try {
      const result = await onSave(event);
      if (result && !result.success && result.error) {
        setFormError(result.error);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : fallbackMessage);
    }
  }, [fallbackMessage, onSave]);

  return { formError, handleSubmit };
}

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { ERROR_CODES } from './constants';

export const ErrorCode = ERROR_CODES;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

type ApiSuccess<T> = {
  success: true;
  status: number;
  error: null;
  data?: T;
  message?: string;
};

type ApiError = {
  success: false;
  status: number;
  data: null;
  error: {
    code: ErrorCodeType;
    message: string;
    details?: unknown;
  };
  message: string;
};

type ErrorLike = {
  code?: number;
  message?: string;
};

export class AppError extends Error {
  code: ErrorCodeType;
  status: number;
  details?: unknown;

  constructor(code: ErrorCodeType, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function sendSuccess<T>(data?: T, statusOrMessage?: number | string, status = 200): NextResponse<ApiSuccess<T>> {
  const finalStatus = typeof statusOrMessage === 'number' ? statusOrMessage : status;
  const message = typeof statusOrMessage === 'string' ? statusOrMessage : undefined;
  const payload: ApiSuccess<T> = {
    success: true,
    status: finalStatus,
    error: null,
  };

  if (data !== undefined) payload.data = data;
  if (message !== undefined) payload.message = message;

  return NextResponse.json(payload, { status: finalStatus });
}

export function sendError(
  code: ErrorCodeType,
  message: string,
  statusOrDetails?: number | unknown,
  status = 400
): NextResponse<ApiError> {
  const finalStatus = typeof statusOrDetails === 'number' ? statusOrDetails : status;
  const details = typeof statusOrDetails !== 'number' ? statusOrDetails : undefined;
  const payload: ApiError = {
    success: false,
    status: finalStatus,
    data: null,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    message,
  };

  return NextResponse.json(payload, { status: finalStatus });
}

export function handleApiError(err: unknown): NextResponse<ApiError> {
  if (err instanceof AppError) {
    return sendError(err.code, err.message, err.details, err.status);
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return sendError('VALIDATION_ERROR', err.issues[0]?.message || 'Dữ liệu không hợp lệ', details, 400);
  }

  const errorLike = err as ErrorLike | null;
  if (errorLike && (errorLike.code === 11000 || errorLike.code === 11001)) {
    return sendError('CONFLICT', 'Dữ liệu bị trùng lặp', 409);
  }

  const message = process.env.NODE_ENV === 'production'
    ? 'Đã xảy ra lỗi hệ thống'
    : errorLike?.message || 'Lỗi hệ thống';

  return sendError('INTERNAL_ERROR', message, 500);
}

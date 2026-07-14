import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { ERROR_CODES } from './constants';

export type ErrorCodeType = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

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

const DEFAULT_ZOD_MESSAGE_PREFIXES = [
  'Invalid input',
  'Too small',
  'Too big',
  'Invalid string',
  'Invalid email',
  'Invalid URL',
  'Unrecognized key',
  'Invalid key',
  'Invalid element',
];

function getZodIssueMessage(issue: ZodError['issues'][number]): string {
  const isDefaultEnglishMessage = DEFAULT_ZOD_MESSAGE_PREFIXES.some((prefix) =>
    issue.message.startsWith(prefix)
  );
  if (!isDefaultEnglishMessage) return issue.message;

  if (issue.code === 'invalid_type') {
    return issue.message.includes('received undefined')
      ? 'Trường này là bắt buộc'
      : 'Kiểu dữ liệu không hợp lệ';
  }
  if (issue.code === 'too_small') return 'Dữ liệu chưa đạt giá trị tối thiểu';
  if (issue.code === 'too_big') return 'Dữ liệu vượt quá giá trị tối đa';
  if (issue.code === 'invalid_format') return 'Định dạng dữ liệu không hợp lệ';
  if (issue.code === 'invalid_value') return 'Giá trị không hợp lệ';
  if (issue.code === 'unrecognized_keys') return 'Dữ liệu chứa trường không được hỗ trợ';
  return 'Dữ liệu không hợp lệ';
}

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
      message: getZodIssueMessage(i),
    }));
    return sendError('VALIDATION_ERROR', details[0]?.message || 'Dữ liệu không hợp lệ', details, 400);
  }

  const errorLike = err as ErrorLike | null;
  if (errorLike && (errorLike.code === 11000 || errorLike.code === 11001)) {
    return sendError('CONFLICT', 'Dữ liệu bị trùng lặp', 409);
  }

  console.error('[handleApiError] Unhandled error:', err);

  const message = process.env.NODE_ENV === 'production'
    ? 'Đã xảy ra lỗi hệ thống'
    : errorLike?.message || 'Lỗi hệ thống';

  return sendError('INTERNAL_ERROR', message, 500);
}

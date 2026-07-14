import { NextRequest } from 'next/server';
import { connectMongo, checkDatabaseConsistency } from '@/lib/db';
import { debugGuard } from '@/lib/debug-guard';
import { AppError, handleApiError, sendSuccess } from '@/lib/api-response';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const guardResponse = debugGuard(request);
    if (guardResponse) return guardResponse;

    await connectMongo();
    const report = await checkDatabaseConsistency();

    return sendSuccess({
      connected: true,
      database: {
        expectedCollections: report.expected.length,
        actualCollections: report.actual.length,
        isClean: report.isClean,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error instanceof AppError
      ? error
      : new AppError('INTERNAL_ERROR', 'Không thể kết nối MongoDB', 500, { connected: false }));
  }
}

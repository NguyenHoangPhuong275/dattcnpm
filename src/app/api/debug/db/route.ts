import { NextRequest } from 'next/server';
import { connectMongo, checkDatabaseConsistency } from '@/lib/db';
import { debugGuard } from '@/lib/debug-guard';
import { sendSuccess, sendError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const guardRes = debugGuard(request);
  if (guardRes) return guardRes;

  try {
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
  } catch {
    return sendError('INTERNAL_ERROR', 'MongoDB connection failed', { connected: false }, 500);
  }
}

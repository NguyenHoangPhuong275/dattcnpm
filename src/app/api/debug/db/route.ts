import { NextRequest, NextResponse } from 'next/server';
import { connectMongo, checkDatabaseConsistency } from '@/lib/mongodb';
import { debugGuard } from '@/lib/debug-guard';

export async function GET(request: NextRequest) {
  const guardRes = debugGuard(request);
  if (guardRes) return guardRes;

  try {
    await connectMongo();
    const report = await checkDatabaseConsistency();

    return NextResponse.json({
      status: 'success',
      connected: true,
      database: {
        expectedCollections: report.expected.length,
        actualCollections: report.actual.length,
        isClean: report.isClean,
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      status: 'error',
      connected: false,
      message: 'MongoDB connection failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

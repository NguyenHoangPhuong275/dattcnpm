import { NextResponse } from 'next/server';
import { connectMongo, checkDatabaseConsistency } from '@/lib/mongodb';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

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

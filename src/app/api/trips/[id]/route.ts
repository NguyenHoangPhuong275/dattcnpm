import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Missing x-user-id header' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing trip id' }, { status: 400 });
    }

    const db = await getDb();
    const trip = await db.trips.findById(id);

    if (!trip) {
      return NextResponse.json({ success: false, message: 'Trip not found' }, { status: 404 });
    }
    if (trip.userId !== userId) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await db.trips.deleteOne(id);

    return NextResponse.json({ success: true, message: 'Trip deleted' });
  } catch (err) {
    console.error('[trips DELETE] error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

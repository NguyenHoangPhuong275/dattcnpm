import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Missing x-user-id header' }, { status: 401 });
    }

    const db = await getDb();
    const trips = await db.trips.find({ userId });

    trips.sort((a: any, b: any) => {
      const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dbt = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dbt - da;
    });

    const data = trips.map((t: any) => ({
      _id: t._id,
      title: t.title,
      destination: t.destination,
      startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
      endDate: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : '',
      isPublic: !!t.isPublic,
      description: t.description || '',
      coverImage: t.coverImage || null,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : '',
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[trips GET] error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Missing x-user-id header' }, { status: 401 });
    }

    const body = await request.json();
    const title = (body.title || '').toString().trim();
    const destination = (body.destination || '').toString().trim();

    if (!title || !destination) {
      return NextResponse.json({ success: false, message: 'Tiêu đề và điểm đến là bắt buộc' }, { status: 400 });
    }

    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    const endDate = body.endDate ? new Date(body.endDate) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ success: false, message: 'Ngày không hợp lệ' }, { status: 400 });
    }

    const db = await getDb();
    const created = await db.trips.insertOne({
      userId,
      title,
      destination,
      startDate,
      endDate,
      description: body.description ? body.description.toString().trim() : null,
      coverImage: body.coverImage ? body.coverImage.toString() : null,
      isPublic: body.isPublic === true,
      metadata: null,
    });

    const trip = {
      _id: created._id,
      title: created.title,
      destination: created.destination,
      startDate: created.startDate ? new Date(created.startDate).toISOString().split('T')[0] : '',
      endDate: created.endDate ? new Date(created.endDate).toISOString().split('T')[0] : '',
      isPublic: !!created.isPublic,
      description: created.description || '',
      coverImage: created.coverImage || null,
      createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : '',
    };

    return NextResponse.json({ success: true, data: trip }, { status: 201 });
  } catch (err) {
    console.error('[trips POST] error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

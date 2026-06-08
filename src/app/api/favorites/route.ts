import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Missing x-user-id header' }, { status: 401 });
    }

    const db = await getDb();
    const favs = await db.favorites.find({ userId });

    favs.sort((a: any, b: any) => {
      const da = new Date(a.createdAt || 0).getTime();
      const dbt = new Date(b.createdAt || 0).getTime();
      return dbt - da;
    });

    const data = await Promise.all(
      favs.map(async (f: any) => {
        const place = f.placeId ? await db.places.findById(f.placeId) : null;
        return {
          _id: f._id,
          placeId: f.placeId || null,
          name: place?.name || 'Địa điểm đã lưu',
          type: place?.type || 'custom',
          address: place?.address || '',
          lat: place?.lat ?? 0,
          lng: place?.lng ?? 0,
        };
      })
    );

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[favorites GET] error:', err);
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
    let placeId = body.placeId ? body.placeId.toString().trim() : '';
    const name = (body.name || '').toString().trim();

    if (!name && !placeId) {
      return NextResponse.json({ success: false, message: 'Tên địa điểm hoặc placeId là bắt buộc' }, { status: 400 });
    }

    const db = await getDb();

    if (!placeId && name) {
      const lat = typeof body.lat === 'number' ? body.lat : 0;
      const lng = typeof body.lng === 'number' ? body.lng : 0;
      const address = body.address ? body.address.toString().trim() : null;
      const createdPlace = await db.places.insertOne({
        name,
        type: 'custom',
        lat,
        lng,
        address,
        ratingAvg: 0,
        ratingCount: 0,
      });
      placeId = createdPlace._id;
    }

    if (!placeId) {
      return NextResponse.json({ success: false, message: 'Không thể xác định placeId' }, { status: 400 });
    }

    const existing = await db.favorites.find({ userId, placeId });
    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: 'Địa điểm đã được lưu' }, { status: 409 });
    }

    const created = await db.favorites.insertOne({
      userId,
      placeId,
    });

    const place = await db.places.findById(placeId);
    const fav = {
      _id: created._id,
      placeId,
      name: place?.name || name || 'Địa điểm đã lưu',
      type: place?.type || 'custom',
      address: place?.address || body.address || '',
      lat: place?.lat ?? body.lat ?? 0,
      lng: place?.lng ?? body.lng ?? 0,
    };

    return NextResponse.json({ success: true, data: fav }, { status: 201 });
  } catch (err) {
    console.error('[favorites POST] error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

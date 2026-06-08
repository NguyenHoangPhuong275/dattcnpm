import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUserProfile } from '@/lib/mongodb';
import { storeAvatar, getAvatar } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Missing x-user-id header' }, { status: 400 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let avatarUrl = await getAvatar(userId);
    if (!avatarUrl && user.avatarUrl && user.avatarUrl.startsWith('data:')) {
      await storeAvatar(userId, user.avatarUrl);
      avatarUrl = user.avatarUrl;
    }
    const profile = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: avatarUrl || user.avatarUrl || null,
      phone: user.phone || '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      gender: user.gender || '',
      nationality: user.nationality || '',
      preferredLanguage: user.preferredLanguage || '',
      homeCity: user.homeCity || '',
      emergencyContact: user.emergencyContact || { name: '', phone: '' },
      travelStyles: user.travelStyles || [],
      budgetLevel: user.budgetLevel || 'Trung bình',
      preferredDestinations: user.preferredDestinations || [],
      interests: user.interests || [],
      twoFactorEnabled: !!user.twoFactorEnabled,
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
    };

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error('[profile GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Missing x-user-id header' }, { status: 400 });
    }

    const body = await request.json();
    const updates: any = {};

    
    if (body.fullName !== undefined) updates.fullName = body.fullName;
    if (body.phone !== undefined) updates.phone = body.phone || null;
    if (body.dateOfBirth !== undefined) updates.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
    if (body.gender !== undefined) updates.gender = body.gender || null;
    if (body.nationality !== undefined) updates.nationality = body.nationality || null;
    if (body.preferredLanguage !== undefined) updates.preferredLanguage = body.preferredLanguage || null;
    if (body.homeCity !== undefined) updates.homeCity = body.homeCity || null;
    if (body.emergencyContact !== undefined) updates.emergencyContact = body.emergencyContact || null;

    if (body.avatarUrl !== undefined) {
      if (body.avatarUrl && typeof body.avatarUrl === 'string' && body.avatarUrl.startsWith('data:')) {
        await storeAvatar(userId, body.avatarUrl);
        updates.avatarUrl = `redis:avatar:${userId}`;
      } else {
        updates.avatarUrl = body.avatarUrl || null;
      }
    }

    if (body.twoFactorEnabled !== undefined) updates.twoFactorEnabled = !!body.twoFactorEnabled;

    
    if (body.travelStyles !== undefined) updates.travelStyles = body.travelStyles || [];
    if (body.budgetLevel !== undefined) updates.budgetLevel = body.budgetLevel || null;
    if (body.preferredDestinations !== undefined) updates.preferredDestinations = body.preferredDestinations || [];
    if (body.interests !== undefined) updates.interests = body.interests || [];

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await updateUserProfile(userId, updates);
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let resolvedAvatar = updated.avatarUrl;
    if (updated.avatarUrl && updated.avatarUrl.startsWith('redis:avatar:')) {
      const fromRedis = await getAvatar(userId);
      if (fromRedis) resolvedAvatar = fromRedis;
    }

    return NextResponse.json({ success: true, profile: {
      id: updated._id,
      email: updated.email,
      fullName: updated.fullName,
      avatarUrl: resolvedAvatar || null,
      phone: updated.phone || '',
      dateOfBirth: updated.dateOfBirth ? new Date(updated.dateOfBirth).toISOString().split('T')[0] : '',
      gender: updated.gender || '',
      nationality: updated.nationality || '',
      preferredLanguage: updated.preferredLanguage || '',
      homeCity: updated.homeCity || '',
      emergencyContact: updated.emergencyContact || { name: '', phone: '' },
      travelStyles: updated.travelStyles || [],
      budgetLevel: updated.budgetLevel || 'Trung bình',
      preferredDestinations: updated.preferredDestinations || [],
      interests: updated.interests || [],
      twoFactorEnabled: !!updated.twoFactorEnabled,
    }});
  } catch (err) {
    console.error('[profile PATCH] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

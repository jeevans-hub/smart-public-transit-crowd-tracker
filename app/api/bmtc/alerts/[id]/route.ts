import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { deleteBmtcAlert } from '@/services/transit/bmtcAlertService';
import { COOKIE_CONFIG } from '@/utils/constants';
import { verifyToken } from '@/utils/helpers';

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication is required' } }, { status: 401 });
  const { id } = await context.params;
  if (!isValidObjectId(id)) return NextResponse.json({ success: false, error: { code: 'INVALID_ALERT_ID', message: 'Invalid alert ID' } }, { status: 400 });
  try {
    const removed = await deleteBmtcAlert(user.userId, id);
    if (!removed) return NextResponse.json({ success: false, error: { code: 'ALERT_NOT_FOUND', message: 'BMTC alert not found' } }, { status: 404 });
    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'ALERT_STORAGE_UNAVAILABLE', message: 'Unable to delete BMTC alert' } }, { status: 503 });
  }
}

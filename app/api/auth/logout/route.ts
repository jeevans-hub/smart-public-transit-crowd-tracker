import { NextResponse } from 'next/server';
import { COOKIE_CONFIG } from '@/utils/constants';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.delete(COOKIE_CONFIG.name);

  return response;
}

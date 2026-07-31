import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_CONFIG } from '@/utils/constants';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_CONFIG.name)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Return the token for socket authentication
    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error('Get token error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get token' },
      { status: 500 }
    );
  }
}

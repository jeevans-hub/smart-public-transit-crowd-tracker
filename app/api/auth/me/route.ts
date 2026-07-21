import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { findById } from '@/services/userService';
import { verifyToken } from '@/utils/helpers';
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

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        level: user.level,
        experience: user.experience,
        coins: user.coins,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

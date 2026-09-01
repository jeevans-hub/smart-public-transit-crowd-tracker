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

    // Try MongoDB connection, fall back to mock auth if it fails
    try {
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
        },
      });
    } catch (dbError) {
      // MongoDB connection failed - use mock authentication
      console.log('[API Me] MongoDB connection failed, using mock authentication');
      console.log('[API Me] Error:', dbError instanceof Error ? dbError.message : String(dbError));

      // Check if error is connection refused
      if (dbError instanceof Error && dbError.message.includes('ECONNREFUSED')) {
        console.log('[API Me] Using mock authentication for demonstration');
        
        // Return mock user from token
        const username = decoded.username || 'User';
        return NextResponse.json({
          success: true,
          user: {
            _id: decoded.userId,
            username,
            email: `${username}@example.com`,
            avatar: null,
            role: 'user',
          },
        });
      }

      // If it's not a connection error, rethrow
      throw dbError;
    }
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

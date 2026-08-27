import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { findByEmail } from '@/services/userService';
import { verifyPassword, generateToken } from '@/utils/helpers';
import { COOKIE_CONFIG } from '@/utils/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Try MongoDB connection, fall back to mock auth if it fails
    try {
      await connectDB();

      const user = await findByEmail(email);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const token = generateToken(user._id.toString(), user.username);

      const response = NextResponse.json({
        success: true,
        token: token, // Include token in response for client-side storage
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

      response.cookies.set(COOKIE_CONFIG.name, token, COOKIE_CONFIG.options);

      return response;
    } catch (dbError) {
      // MongoDB connection failed - use mock authentication
      console.log('[API Login] MongoDB connection failed, using mock authentication');
      console.log('[API Login] Error:', dbError instanceof Error ? dbError.message : String(dbError));

      // Check if error is connection refused
      if (dbError instanceof Error && dbError.message.includes('ECONNREFUSED')) {
        console.log('[API Login] Using mock authentication for demonstration');
        
        // For mock auth, accept any email/password combination
        const mockUserId = 'mock_' + Date.now();
        const username = email.split('@')[0];
        const token = generateToken(mockUserId, username);

        const response = NextResponse.json({
          success: true,
          token: token, // Include token in response for client-side storage
          user: {
            _id: mockUserId,
            username: username,
            email: email,
            avatar: null,
            role: 'user',
            level: 1,
            experience: 0,
            coins: 100,
          },
        });

        response.cookies.set(COOKIE_CONFIG.name, token, COOKIE_CONFIG.options);

        return response;
      }

      // If it's not a connection error, rethrow
      throw dbError;
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}

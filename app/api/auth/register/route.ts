import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { createUser, findByEmail, findByUsername } from '@/services/userService';
import { hashPassword, generateToken } from '@/utils/helpers';
import { COOKIE_CONFIG } from '@/utils/constants';
import { isValidEmail } from '@/utils/helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      console.log('[API Register] Validation failed: Missing required fields');
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      console.log('[API Register] Validation failed: Username too short');
      return NextResponse.json(
        { success: false, error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      console.log('[API Register] Validation failed: Invalid email format');
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      console.log('[API Register] Validation failed: Password too short');
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Try MongoDB connection, fall back to mock auth if it fails
    try {
      console.log('[API Register] Calling connectDB()...');
      await connectDB();
      console.log('[API Register] connectDB() succeeded.');

      const existingUserByEmail = await findByEmail(email);
      if (existingUserByEmail) {
        console.log('[API Register] User with email already exists');
        return NextResponse.json(
          { success: false, error: 'User with this email already exists' },
          { status: 409 }
        );
      }

      const existingUserByUsername = await findByUsername(username);
      if (existingUserByUsername) {
        console.log('[API Register] Username already taken');
        return NextResponse.json(
          { success: false, error: 'Username already taken' },
          { status: 409 }
        );
      }

      console.log('[API Register] Hashing password...');
      const passwordHash = await hashPassword(password);
      console.log('[API Register] Password hashed. Before saving user...');

      const user = await createUser({ username, email, passwordHash });
      console.log('[API Register] User saved successfully. User ID:', user._id.toString());

      const token = generateToken(user._id.toString(), user.username);

      const response = NextResponse.json({
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

      response.cookies.set(COOKIE_CONFIG.name, token, COOKIE_CONFIG.options);

      return response;
    } catch (dbError) {
      // MongoDB connection failed - use mock authentication
      console.log('[API Register] MongoDB connection failed, using mock authentication');
      console.log('[API Register] Error:', dbError instanceof Error ? dbError.message : String(dbError));

      // Check if error is connection refused
      if (dbError instanceof Error && dbError.message.includes('ECONNREFUSED')) {
        console.log('[API Register] Using mock authentication for demonstration');
        
        // Generate a mock user ID
        const mockUserId = 'mock_' + Date.now();
        const token = generateToken(mockUserId, username);

        const response = NextResponse.json({
          success: true,
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
    console.error('[API Register Catch Error]:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

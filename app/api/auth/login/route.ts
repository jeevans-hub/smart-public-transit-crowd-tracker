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
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}

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
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUserByEmail = await findByEmail(email);
    if (existingUserByEmail) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const existingUserByUsername = await findByUsername(username);
    if (existingUserByUsername) {
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ username, email, passwordHash });

    const token = generateToken(user._id.toString());

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
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}

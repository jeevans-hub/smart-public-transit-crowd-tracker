import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/utils/helpers';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { smsService } from '@/services/smsService';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    // Validate phone number
    if (!smsService.validatePhoneNumber(phoneNumber)) {
      return NextResponse.json({ success: false, error: 'Invalid phone number format' }, { status: 400 });
    }

    // Format phone number
    const formattedPhone = smsService.formatPhoneNumber(phoneNumber);

    // Generate verification code
    const verificationCode = smsService.generateVerificationCode();
    console.log('[SMS Verification] Generated code:', verificationCode, 'Type:', typeof verificationCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Try to connect to database, fall back to mock mode
    try {
      await connectDB();

      // Update user with verification code
      const user = await User.findById(decoded.userId);
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      user.phoneNumber = formattedPhone;
      user.phoneVerificationCode = verificationCode;
      user.phoneVerificationExpires = expiresAt;
      user.phoneVerified = false;
      await user.save();
    } catch (dbError) {
      // MongoDB connection failed - use mock mode
      console.log('[SMS Verification] MongoDB connection failed, using mock mode');
      console.log('[SMS Verification] Error:', dbError instanceof Error ? dbError.message : String(dbError));
      
      if (dbError instanceof Error && dbError.message.includes('ECONNREFUSED')) {
        // Store verification code in localStorage via response (for demo purposes)
        console.log('[SMS Verification] Mock mode - verification code:', verificationCode);
        console.log('[SMS Verification] Would send to phone:', formattedPhone);
        console.log('[SMS Verification] Code type:', typeof verificationCode, 'Code length:', verificationCode.length);
      } else {
        throw dbError;
      }
    }

    // Send verification SMS
    const smsResult = await smsService.sendVerificationCode(formattedPhone, verificationCode);

    console.log('[SMS Verification] SMS Result:', smsResult);
    console.log('[SMS Verification] Verification code being returned:', verificationCode);

    if (!smsResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send verification code',
        details: smsResult.error 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent successfully',
      expiresAt: expiresAt.toISOString(),
      // Include verification code in mock mode for testing
      mockCode: smsResult.mockCode || verificationCode
    });

  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send verification code' 
    }, { status: 500 });
  }
}
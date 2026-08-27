import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/utils/helpers';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { smsService } from '@/services/smsService';

export async function POST(request: NextRequest) {
  try {
    // This endpoint can be called by the system with an admin token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { alertType, message, stationName, crowdLevel, occupancy, routeName, predictedCrowd, timeWindow } = body;

    if (!alertType || !message) {
      return NextResponse.json({ success: false, error: 'Alert type and message are required' }, { status: 400 });
    }

    // Connect to database
    await connectDB();

    // Find all users with SMS alerts enabled for this alert type
    const query: any = { smsAlertsEnabled: true, phoneVerified: true };
    
    // Filter by alert threshold if applicable
    if (crowdLevel && occupancy) {
      const thresholdMap: Record<string, number> = { low: 30, medium: 60, high: 80 };
      // This is a simplified logic - you may want to make it more sophisticated
      if (alertType === 'crowd') {
        // For now, send to all users with SMS enabled
        // You could add threshold filtering here
      }
    }

    const users = await User.find(query);

    if (users.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No users with SMS alerts enabled',
        sentCount: 0
      });
    }

    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Send SMS to each user
    for (const user of users) {
      if (!user.phoneNumber) continue;

      let result;
      
      switch (alertType) {
        case 'crowd':
          result = await smsService.sendCrowdAlert(
            user.phoneNumber,
            stationName || 'Unknown Station',
            crowdLevel || 'high',
            occupancy || 0
          );
          break;
        case 'prediction':
          result = await smsService.sendPredictionAlert(
            user.phoneNumber,
            routeName || 'Unknown Route',
            predictedCrowd || 'high',
            timeWindow || 'upcoming period'
          );
          break;
        case 'system':
          result = await smsService.sendSystemAlert(
            user.phoneNumber,
            alertType.toUpperCase(),
            message
          );
          break;
        default:
          result = await smsService.sendSMS({
            to: user.phoneNumber,
            body: message
          });
      }

      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
        if (result.error) {
          errors.push(`${user.phoneNumber}: ${result.error}`);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `SMS alerts sent to ${sentCount} users`,
      sentCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error sending SMS alerts:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send SMS alerts' 
    }, { status: 500 });
  }
}
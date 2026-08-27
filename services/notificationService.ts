import { smsService } from './smsService';
import User from '@/models/User';

interface AlertData {
  type: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'RESOLVED';
  message: string;
  stationId?: string;
  vehicleId?: string;
  occupancyPercentage?: number;
  timestamp: Date;
}

interface PredictionData {
  routeName?: string;
  predictedCrowd?: string;
  timeWindow?: string;
}

class NotificationService {
  /**
   * Send SMS alerts for crowd alerts
   */
  async sendCrowdAlertSMS(alert: AlertData, stationName?: string) {
    try {
      // Only send SMS for critical and high alerts
      if (alert.type !== 'CRITICAL' && alert.type !== 'HIGH') {
        return { success: true, skipped: true, reason: 'Alert type not critical' };
      }

      // Find users with SMS alerts enabled for this threshold
      // Determine which thresholds should receive this alert
      const applicableThresholds: Array<'low' | 'medium' | 'high'> = alert.type === 'CRITICAL'
        ? ['low', 'medium', 'high'] 
        : ['medium', 'high'];

      // Find users with matching SMS settings
      const users = await User.find({
        smsAlertsEnabled: true,
        phoneVerified: true,
        smsAlertThreshold: { $in: applicableThresholds },
        phoneNumber: { $exists: true, $ne: null },
      });

      if (users.length === 0) {
        return { success: true, skipped: true, reason: 'No eligible users' };
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const user of users) {
        if (!user.phoneNumber) continue;

        const crowdLevel = alert.occupancyPercentage 
          ? (alert.occupancyPercentage > 80 ? 'High' : alert.occupancyPercentage > 60 ? 'Medium' : 'Low')
          : 'High';

        const result = await smsService.sendCrowdAlert(
          user.phoneNumber,
          stationName || alert.stationId || 'Unknown Station',
          crowdLevel,
          alert.occupancyPercentage || 0
        );

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
          console.error(`Failed to send SMS to ${user.phoneNumber}:`, result.error);
        }
      }

      return {
        success: true,
        sentCount,
        failedCount,
        totalUsers: users.length,
      };
    } catch (error) {
      console.error('Error sending crowd alert SMS:', error);
      return { success: false, error: 'Failed to send SMS alerts' };
    }
  }

  /**
   * Send SMS alerts for predictions
   */
  async sendPredictionAlertSMS(prediction: PredictionData) {
    try {
      // Find users with SMS alerts enabled
      const users = await User.find({
        smsAlertsEnabled: true,
        phoneVerified: true,
        phoneNumber: { $exists: true, $ne: null },
      });

      if (users.length === 0) {
        return { success: true, skipped: true, reason: 'No eligible users' };
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const user of users) {
        if (!user.phoneNumber) continue;

        const result = await smsService.sendPredictionAlert(
          user.phoneNumber,
          prediction.routeName || 'Unknown Route',
          prediction.predictedCrowd || 'high',
          prediction.timeWindow || 'upcoming period'
        );

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
          console.error(`Failed to send SMS to ${user.phoneNumber}:`, result.error);
        }
      }

      return {
        success: true,
        sentCount,
        failedCount,
        totalUsers: users.length,
      };
    } catch (error) {
      console.error('Error sending prediction alert SMS:', error);
      return { success: false, error: 'Failed to send SMS alerts' };
    }
  }

  /**
   * Send system alerts via SMS
   */
  async sendSystemAlertSMS(alertType: string, message: string) {
    try {
      // Find users with SMS alerts enabled for system alerts
      const users = await User.find({
        smsAlertsEnabled: true,
        phoneVerified: true,
        smsAlertThreshold: 'low', // Send system alerts to all SMS-enabled users
        phoneNumber: { $exists: true, $ne: null },
      });

      if (users.length === 0) {
        return { success: true, skipped: true, reason: 'No eligible users' };
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const user of users) {
        if (!user.phoneNumber) continue;

        const result = await smsService.sendSystemAlert(
          user.phoneNumber,
          alertType,
          message
        );

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
          console.error(`Failed to send SMS to ${user.phoneNumber}:`, result.error);
        }
      }

      return {
        success: true,
        sentCount,
        failedCount,
        totalUsers: users.length,
      };
    } catch (error) {
      console.error('Error sending system alert SMS:', error);
      return { success: false, error: 'Failed to send SMS alerts' };
    }
  }
}

export const notificationService = new NotificationService();

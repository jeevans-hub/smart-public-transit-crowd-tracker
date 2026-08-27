import { env } from '@/lib/env';

interface SMSConfig {
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
}

interface SMSMessage {
  to: string;
  body: string;
}

class SMSService {
  private config: SMSConfig;

  constructor() {
    this.config = {
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      phoneNumber: env.TWILIO_PHONE_NUMBER,
    };
  }

  /**
   * Check if SMS service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.accountSid && this.config.authToken && this.config.phoneNumber);
  }

  /**
   * Send an SMS message
   */
  async sendSMS(message: SMSMessage): Promise<{ success: boolean; error?: string; messageId?: string }> {
    if (!this.isConfigured()) {
      console.warn('SMS service not configured. Mocking SMS send.');
      console.log(`[MOCK SMS] To: ${message.to}, Body: ${message.body}`);
      return { success: true, messageId: 'mock-' + Date.now() };
    }

    try {
      // Dynamically import Twilio to avoid issues if not installed
      const twilio = require('twilio');
      const client = twilio(this.config.accountSid, this.config.authToken);

      const result = await client.messages.create({
        body: message.body,
        from: this.config.phoneNumber,
        to: message.to,
      });

      console.log(`SMS sent successfully. Message SID: ${result.sid}`);
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error sending SMS' 
      };
    }
  }

  /**
   * Send verification code
   */
  async sendVerificationCode(phoneNumber: string, code: string): Promise<{ success: boolean; error?: string; mockCode?: string }> {
    const message = `Your verification code for Smart Transit is: ${code}. This code expires in 10 minutes.`;
    
    const result = await this.sendSMS({
      to: phoneNumber,
      body: message,
    });

    // In mock mode, include the code for testing
    if (!this.isConfigured() && result.success) {
      return { success: true, mockCode: code };
    }

    return result;
  }

  /**
   * Send crowd alert
   */
  async sendCrowdAlert(
    phoneNumber: string, 
    stationName: string, 
    crowdLevel: string,
    occupancy: number
  ): Promise<{ success: boolean; error?: string }> {
    const message = `ALERT: ${stationName} is experiencing ${crowdLevel} crowd levels (${occupancy}% occupancy). Please consider alternative routes.`;
    
    const result = await this.sendSMS({
      to: phoneNumber,
      body: message,
    });

    return result;
  }

  /**
   * Send prediction alert
   */
  async sendPredictionAlert(
    phoneNumber: string,
    routeName: string,
    predictedCrowd: string,
    timeWindow: string
  ): Promise<{ success: boolean; error?: string }> {
    const message = `PREDICTION: Route ${routeName} is expected to have ${predictedCrowd} crowd levels in the ${timeWindow}. Plan accordingly.`;
    
    const result = await this.sendSMS({
      to: phoneNumber,
      body: message,
    });

    return result;
  }

  /**
   * Send system alert
   */
  async sendSystemAlert(
    phoneNumber: string,
    alertType: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    const smsMessage = `SYSTEM ${alertType}: ${message}`;
    
    const result = await this.sendSMS({
      to: phoneNumber,
      body: smsMessage,
    });

    return result;
  }

  /**
   * Format phone number to E.164 format
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91 by default)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    // Format as E.164
    return '+' + cleaned;
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Check if it's a valid Indian number (10 digits or 12 with country code)
    return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91'));
  }

  /**
   * Generate verification code
   */
  generateVerificationCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000);
    console.log('Generated verification code:', code);
    return code.toString();
  }
}

// Export singleton instance
export const smsService = new SMSService();
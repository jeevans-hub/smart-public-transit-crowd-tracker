# SMS Alerts Setup Guide

This document explains how to configure SMS alerts functionality for the Smart Public Transit Crowd Tracker.

## Prerequisites

To use SMS alerts, you need a Twilio account. Twilio is a cloud communications platform that provides SMS sending capabilities.

### Getting Twilio Credentials

1. **Sign up for Twilio**
   - Go to [https://www.twilio.com](https://www.twilio.com)
   - Create a free account (you'll get free credits for testing)

2. **Get your Account SID and Auth Token**
   - Log in to your Twilio Console
   - Navigate to Account Settings > API Keys & Credentials
   - Copy your Account SID and Auth Token

3. **Get a Twilio Phone Number**
   - In the Twilio Console, go to Phone Numbers > Manage > Buy a Number
   - Purchase a phone number (or use the free trial number)
   - Copy the phone number in E.164 format (e.g., +1234567890)

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

### Environment Variable Details

- `TWILIO_ACCOUNT_SID`: Your Twilio account identifier (starts with 'AC')
- `TWILIO_AUTH_TOKEN`: Your Twilio authentication token (keep this secret!)
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number in E.164 format (e.g., +91XXXXXXXXXX)

## Testing SMS Functionality

### Without Twilio Credentials (Mock Mode)

The SMS service includes a mock mode that works without Twilio credentials. This is useful for development and testing:

- When Twilio credentials are not configured, SMS sending is simulated
- SMS messages are logged to the console instead of being actually sent
- This allows you to test the UI and verification flow without spending money

### With Twilio Credentials (Production Mode)

When you add real Twilio credentials:

- SMS messages are actually sent to phone numbers
- Phone verification codes will be delivered via SMS
- Crowd alerts will be sent as real SMS messages

## User Setup for SMS Alerts

1. **Add Phone Number**
   - Users go to Settings > Notifications
   - Enter their phone number (10-digit Indian number or with country code)
   - Click "Send Code" to receive a verification code

2. **Verify Phone Number**
   - Enter the 6-digit verification code received via SMS
   - Click "Verify" to confirm the phone number
   - Once verified, the phone number is marked as verified

3. **Enable SMS Alerts**
   - Toggle "SMS Alerts" to enable
   - Select alert threshold (Low/Medium/High)
   - Save settings

## Alert Thresholds

- **Low**: Receive all alerts (informational, warnings, critical)
- **Medium**: Receive important alerts only (warnings, critical)
- **High**: Receive critical alerts only

## SMS Alert Types

1. **Crowd Alerts**
   - Sent when stations/vehicles reach critical/high crowd levels
   - Includes station name, crowd level, and occupancy percentage
   - Only sent to users with appropriate alert threshold

2. **Prediction Alerts**
   - Sent when AI predictions indicate high crowd levels
   - Includes route name, predicted crowd level, and time window

3. **System Alerts**
   - Sent for important system notifications
   - Includes alert type and detailed message

## Cost Considerations

- Twilio charges per SMS message sent
- Check Twilio pricing for current rates in your region
- Monitor usage to control costs
- Consider using alert thresholds to reduce unnecessary SMS

## Troubleshooting

### SMS Not Sending

1. Check that Twilio credentials are correctly set in `.env.local`
2. Verify your Twilio account has sufficient credits
3. Check console logs for error messages
4. Ensure phone numbers are in E.164 format

### Verification Code Not Received

1. Verify the phone number format is correct
2. Check if the phone number is blocked by Twilio
3. Ensure your Twilio account can send to that region
4. Try with a different phone number

### Phone Number Validation Issues

- The system expects Indian phone numbers (10 digits or 12 with country code)
- Format: `9876543210` or `919876543210`
- System will automatically add `+91` if only 10 digits provided

## Security Notes

- Never commit `.env.local` to version control
- Keep Twilio Auth Token secure
- Rotate Auth Token if compromised
- Use environment-specific credentials (dev/staging/prod)
- Consider using Twilio's Verify API for enhanced security

## Development Tips

1. **Use Mock Mode During Development**
   - Don't set Twilio credentials in development
   - Test the entire flow with console logging
   - Add real credentials only when needed

2. **Rate Limiting**
   - Consider implementing rate limiting for verification codes
   - Prevent abuse by limiting code requests per phone number

3. **Error Handling**
   - The service gracefully handles missing Twilio credentials
   - Check logs for SMS sending failures
   - Implement retry logic for failed SMS

## Future Enhancements

Potential improvements to consider:

- Add SMS template management
- Implement scheduled SMS messages
- Add SMS delivery status tracking
- Support multiple SMS providers
- Add SMS analytics and reporting
- Implement SMS consent management
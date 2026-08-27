<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## SMS Alerts Configuration

The project includes SMS alerts functionality using Twilio. To enable SMS alerts:

1. Add Twilio credentials to `.env.local`:
   - `TWILIO_ACCOUNT_SID=your-account-sid`
   - `TWILIO_AUTH_TOKEN=your-auth-token`
   - `TWILIO_PHONE_NUMBER=your-phone-number`

2. The SMS service works in mock mode without credentials (logs to console)
3. With credentials, it sends real SMS messages for:
   - Phone number verification
   - Crowd alerts (critical/high levels)
   - Prediction alerts
   - System alerts

4. Users can:
   - Add and verify phone numbers in Settings > Notifications
   - Configure SMS alert thresholds (Low/Medium/High)
   - Enable/disable SMS alerts

See `SMS_SETUP.md` for detailed setup instructions.

const getEnv = () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  const JWT_SECRET = process.env.JWT_SECRET;
  const NEXT_PUBLIC_APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable');
  }

  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET environment variable');
  }

  if (!NEXT_PUBLIC_APP_NAME) {
    throw new Error('Missing NEXT_PUBLIC_APP_NAME environment variable');
  }

  return {
    MONGODB_URI,
    JWT_SECRET,
    NEXT_PUBLIC_APP_NAME,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
  };
};

export const env = {
  get MONGODB_URI() {
    return getEnv().MONGODB_URI;
  },
  get JWT_SECRET() {
    return getEnv().JWT_SECRET;
  },
  get NEXT_PUBLIC_APP_NAME() {
    return getEnv().NEXT_PUBLIC_APP_NAME;
  },
  get TWILIO_ACCOUNT_SID() {
    return getEnv().TWILIO_ACCOUNT_SID;
  },
  get TWILIO_AUTH_TOKEN() {
    return getEnv().TWILIO_AUTH_TOKEN;
  },
  get TWILIO_PHONE_NUMBER() {
    return getEnv().TWILIO_PHONE_NUMBER;
  },
};

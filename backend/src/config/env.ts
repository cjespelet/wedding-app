import 'dotenv/config';

const required = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Missing required env var ${name}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 4000,
  jwtSecret: required(process.env.JWT_SECRET, 'JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  databaseUrl: required(process.env.DATABASE_URL, 'DATABASE_URL'),
};


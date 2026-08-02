import 'dotenv/config';
import type { SignOptions } from 'jsonwebtoken';

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
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'],
  databaseUrl: required(process.env.DATABASE_URL, 'DATABASE_URL'),
  /** Si coincide, permite ingresar como invitado con cualquier username registrado. Vacío = desactivado. */
  guestMasterPassword:
    process.env.GUEST_MASTER_PASSWORD !== undefined
      ? process.env.GUEST_MASTER_PASSWORD.trim() || undefined
      : '12345',
};


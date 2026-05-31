import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'nar_admin_session';
const SESSION_HOURS = 8;

const getSecret = () => {
  if (process.env.ADMIN_AUTH_SECRET) {
    return process.env.ADMIN_AUTH_SECRET.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_AUTH_SECRET is required in production.');
  }

  return 'dev_admin_secret_change_me';
};

const getPassword = () => {
  const pwd = process.env.ADMIN_PASSWORD;
  return pwd ? pwd.trim() : undefined;
};

type SessionPayload = {
  sub: 'admin';
  exp: number;
};

const signPayload = (payload: SessionPayload) => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
};

const verifyToken = (token: string): boolean => {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return false;

  const expectedSig = createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  const validSig = timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  if (!validSig) return false;

  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
  return payload.sub === 'admin' && payload.exp > Date.now();
};

export const validateAdminPassword = (password: string) => {
  const configuredPassword = getPassword();

  if (!configuredPassword) {
    return false;
  }

  const provided = Buffer.from(password);
  const expected = Buffer.from(configuredPassword);

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
};

export const createAdminSessionToken = () => {
  const payload: SessionPayload = {
    sub: 'admin',
    exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  };
  return signPayload(payload);
};

export const setAdminSessionCookie = async (token: string) => {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_HOURS * 60 * 60,
  });
};

export const clearAdminSessionCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
};

export const isAdminAuthenticated = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    return verifyToken(token);
  } catch {
    return false;
  }
};

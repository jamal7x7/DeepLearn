import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from '@noble/hashes/utils';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

import { NewUser, User } from '@/lib/db/schema';

const key = new TextEncoder().encode(process.env.AUTH_SECRET || 'default_secret');
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32;
const SALT_LENGTH = 16;

/**
 * Hash a password using PBKDF2 (Edge-compatible)
 * Returns a string: salt:hash (both hex)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const hash = await pbkdf2Async(sha256, new TextEncoder().encode(password), salt, { c: PBKDF2_ITERATIONS, dkLen: PBKDF2_KEYLEN });
  return `${Buffer.from(salt).toString('hex')}:${Buffer.from(hash).toString('hex')}`;
}

/**
 * Compare a plain password to a PBKDF2 hash (salt:hash format)
 */
export async function comparePasswords(plainTextPassword: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expectedHash = Buffer.from(hashHex, 'hex');
  const hash = await pbkdf2Async(sha256, new TextEncoder().encode(plainTextPassword), salt, { c: PBKDF2_ITERATIONS, dkLen: PBKDF2_KEYLEN });
  // Constant-time comparison
  return hash.length === expectedHash.length && hash.every((val, i) => val === expectedHash[i]);
}

type SessionData = {
  user: { id: number, role: string };
  expires: string;
};

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as SessionData;
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await verifyToken(session);
}

export async function setSession(user: User) {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: SessionData = {
    user: { id: user.id!, role: user.role },
    expires: expiresInOneDay.toISOString(),
  };
  const encryptedSession = await signToken(session);
  (await cookies()).set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
}

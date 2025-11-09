// Auth Helper Functions
// Basit session yönetimi (demo için)

import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Basit session token (gerçek üretimde JWT kullanılmalı)
export function generateSessionToken(userId: string, email: string, role: string): string {
  const payload = {
    userId,
    email,
    role,
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 gün
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function verifySessionToken(token: string): any | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (payload.exp < Date.now()) {
      return null; // Token expired
    }
    return payload;
  } catch {
    return null;
  }
}

// Alias for compatibility
export const verifyToken = verifySessionToken;

export function getUserFromRequest(request: Request): any | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifySessionToken(token);
}

// Alias for verifyAuth compatibility
export const verifyAuth = getUserFromRequest;

import { NextRequest } from 'next/server';
import { verifyToken, type JwtPayload } from './jwt';

export function getTokenFromRequest(req: NextRequest): string | null {
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  const cookie = req.cookies.get('token')?.value;
  return cookie ?? null;
}

export function requireAuth(req: NextRequest): JwtPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

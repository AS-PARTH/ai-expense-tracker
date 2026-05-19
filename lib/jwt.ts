import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  if (!SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): JwtPayload | null {
  if (!SECRET) return null;
  try {
    const decoded = jwt.verify(token, SECRET) as JwtPayload;
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}

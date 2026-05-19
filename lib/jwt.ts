import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error(
      'JWT_SECRET is not set. Add it to .env.local (development) or your Vercel environment variables (production).'
    );
  }
  return secret;
}

function getExpiresIn(): jwt.SignOptions['expiresIn'] {
  return (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: getExpiresIn() });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as JwtPayload;
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}

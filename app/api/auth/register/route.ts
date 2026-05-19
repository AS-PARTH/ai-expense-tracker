import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';
import { registerSchema } from '@/lib/validators';
import { signToken } from '@/lib/jwt';
import { ok, fail, serverError } from '@/lib/api';
import { toPublicUser } from '@/lib/serialize';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || 'Invalid input', 400, 'VALIDATION');
    }
    const { email, password, name } = parsed.data;

    await dbConnect();
    const existing = await User.findOne({ email });
    if (existing) return fail('Email already in use', 400, 'EMAIL_TAKEN');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name });
    const token = signToken({ userId: user._id.toString(), email: user.email });

    return ok({ token, user: toPublicUser(user) }, 201);
  } catch (err) {
    return serverError(err);
  }
}

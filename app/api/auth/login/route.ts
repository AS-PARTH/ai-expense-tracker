import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';
import { loginSchema } from '@/lib/validators';
import { signToken } from '@/lib/jwt';
import { ok, fail, serverError } from '@/lib/api';
import { toPublicUser } from '@/lib/serialize';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return fail('Invalid email or password', 400, 'VALIDATION');
    const { email, password } = parsed.data;

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return fail('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return fail('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    const token = signToken({ userId: user._id.toString(), email: user.email });
    return ok({ token, user: toPublicUser(user) });
  } catch (err) {
    return serverError(err);
  }
}

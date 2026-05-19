import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/auth';
import { ok, unauthorized, fail, serverError } from '@/lib/api';
import { toPublicUser } from '@/lib/serialize';

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) return unauthorized();

    await dbConnect();
    const user = await User.findById(auth.userId).lean();
    if (!user) return fail('User not found', 404, 'NOT_FOUND');

    return ok({ user: toPublicUser(user) });
  } catch (err) {
    return serverError(err);
  }
}

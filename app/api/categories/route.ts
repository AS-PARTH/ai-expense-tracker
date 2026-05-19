import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Category as CategoryModel } from '@/models/Category';
import { requireAuth } from '@/lib/auth';
import { categoryCreateSchema } from '@/lib/validators';
import { ok, fail, unauthorized, serverError } from '@/lib/api';
import { DEFAULT_CATEGORIES, type UserCategory } from '@/types';

function toUserCategory(d: {
  _id: { toString(): string };
  userId: { toString(): string };
  name: string;
  createdAt: Date;
}): UserCategory {
  return {
    _id: d._id.toString(),
    userId: d.userId.toString(),
    name: d.name,
    createdAt: d.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) return unauthorized();
    await dbConnect();

    const customs = await CategoryModel.find({ userId: auth.userId }).sort({ name: 1 }).lean();
    const customNames = customs.map((c) => c.name);
    const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...customNames]));

    return ok({
      defaults: [...DEFAULT_CATEGORIES],
      custom: customs.map(toUserCategory),
      all: merged,
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const parsed = categoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || 'Invalid name', 400, 'VALIDATION');
    }
    const name = parsed.data.name;

    if ((DEFAULT_CATEGORIES as readonly string[]).includes(name)) {
      return fail('That category already exists', 400, 'DUPLICATE');
    }

    await dbConnect();
    try {
      const doc = await CategoryModel.create({ userId: auth.userId, name });
      return ok(toUserCategory(doc), 201);
    } catch (err) {
      if (err instanceof Error && err.message.includes('duplicate key')) {
        return fail('That category already exists', 400, 'DUPLICATE');
      }
      throw err;
    }
  } catch (err) {
    return serverError(err);
  }
}

import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { Category as CategoryModel } from '@/models/Category';
import { Expense } from '@/models/Expense';
import { requireAuth } from '@/lib/auth';
import { categoryCreateSchema } from '@/lib/validators';
import { ok, fail, unauthorized, serverError } from '@/lib/api';
import { DEFAULT_CATEGORIES, type UserCategory } from '@/types';

interface RawCategoryDoc {
  _id: mongoose.Types.ObjectId | { toString(): string };
  userId: mongoose.Types.ObjectId | { toString(): string };
  name: string;
  createdAt: Date;
}

function toUserCategory(d: RawCategoryDoc, usage = 0): UserCategory & { usage: number } {
  return {
    _id: d._id.toString(),
    userId: d.userId.toString(),
    name: d.name,
    createdAt: d.createdAt.toISOString(),
    usage,
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) return unauthorized();
    await dbConnect();

    const userObjectId = new mongoose.Types.ObjectId(auth.userId);
    const [customs, usageAgg] = await Promise.all([
      CategoryModel.find({ userId: auth.userId }).sort({ name: 1 }).lean(),
      Expense.aggregate<{ _id: string; count: number }>([
        { $match: { userId: userObjectId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    const usageMap = new Map(usageAgg.map((r) => [r._id, r.count]));
    const customNames = customs.map((c) => c.name);
    const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...customNames]));

    return ok({
      defaults: [...DEFAULT_CATEGORIES],
      custom: customs.map((c) => toUserCategory(c, usageMap.get(c.name) ?? 0)),
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
      return ok(toUserCategory(doc.toObject() as RawCategoryDoc), 201);
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

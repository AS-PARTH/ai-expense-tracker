import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { Category as CategoryModel } from '@/models/Category';
import { requireAuth } from '@/lib/auth';
import { ok, fail, unauthorized, serverError } from '@/lib/api';

type RouteCtx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  try {
    const auth = requireAuth(req);
    if (!auth) return unauthorized();

    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return fail('Invalid id', 400, 'INVALID_ID');

    await dbConnect();
    const doc = await CategoryModel.findOneAndDelete({ _id: id, userId: auth.userId });
    if (!doc) return fail('Category not found', 404, 'NOT_FOUND');
    return ok({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}

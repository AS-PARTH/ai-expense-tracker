import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { Category as CategoryModel } from '@/models/Category';
import { Expense } from '@/models/Expense';
import { Budget } from '@/models/Budget';
import { requireAuth } from '@/lib/auth';
import { ok, fail, unauthorized, serverError } from '@/lib/api';

type RouteCtx = { params: Promise<{ id: string }> };

const REASSIGN_TO = 'other';

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  try {
    const auth = requireAuth(req);
    if (!auth) return unauthorized();

    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return fail('Invalid id', 400, 'INVALID_ID');

    await dbConnect();
    const cat = await CategoryModel.findOne({ _id: id, userId: auth.userId });
    if (!cat) return fail('Category not found', 404, 'NOT_FOUND');

    const url = new URL(req.url);
    const force = url.searchParams.get('force') === '1';
    const userObjectId = new mongoose.Types.ObjectId(auth.userId);

    const usage = await Expense.countDocuments({ userId: userObjectId, category: cat.name });

    if (usage > 0 && !force) {
      return fail(
        `${usage} expense${usage === 1 ? '' : 's'} use this category. Confirm to reassign them to "${REASSIGN_TO}".`,
        409,
        'IN_USE'
      );
    }

    let reassigned = 0;
    if (usage > 0) {
      const result = await Expense.updateMany(
        { userId: userObjectId, category: cat.name },
        { $set: { category: REASSIGN_TO } }
      );
      reassigned = result.modifiedCount;
      // Also remove the per-category budget if any
      await Budget.deleteOne({ userId: userObjectId, category: cat.name });
    }

    await CategoryModel.deleteOne({ _id: cat._id });

    return ok({ deleted: true, reassigned, reassignedTo: REASSIGN_TO });
  } catch (err) {
    return serverError(err);
  }
}

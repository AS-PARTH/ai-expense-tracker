import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { Expense } from '@/models/Expense';
import { requireAuth } from '@/lib/auth';
import { ok, unauthorized, serverError } from '@/lib/api';
import type { Category, DashboardSummary } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) return unauthorized();
    await dbConnect();

    const url = new URL(req.url);
    const monthParam = url.searchParams.get('month'); // YYYY-MM
    const now = new Date();
    const refY = monthParam ? Number(monthParam.slice(0, 4)) : now.getUTCFullYear();
    const refM = monthParam ? Number(monthParam.slice(5, 7)) : now.getUTCMonth() + 1;

    const monthStart = new Date(Date.UTC(refY, refM - 1, 1));
    const monthEnd = new Date(Date.UTC(refY, refM, 1));

    const sixMonthsAgo = new Date(Date.UTC(refY, refM - 6, 1));

    const userId = new mongoose.Types.ObjectId(auth.userId);

    const [byCatAgg, trendAgg, totalAgg] = await Promise.all([
      Expense.aggregate<{ _id: Category; total: number }>([
        { $match: { userId, date: { $gte: monthStart, $lt: monthEnd } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate<{ _id: { y: number; m: number }; total: number }>([
        { $match: { userId, date: { $gte: sixMonthsAgo, $lt: monthEnd } } },
        {
          $group: {
            _id: { y: { $year: '$date' }, m: { $month: '$date' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
      Expense.aggregate<{ total: number }>([
        { $match: { userId, date: { $gte: monthStart, $lt: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    // Build a 6-month series with zeroes for missing months
    const trendMap = new Map<string, number>();
    for (const row of trendAgg) {
      const key = `${row._id.y}-${String(row._id.m).padStart(2, '0')}`;
      trendMap.set(key, row.total);
    }
    const trend6m: DashboardSummary['trend6m'] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(refY, refM - 1 - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      trend6m.push({ month: key, amount: trendMap.get(key) ?? 0 });
    }

    const summary: DashboardSummary = {
      monthTotal: totalAgg[0]?.total ?? 0,
      byCategory: byCatAgg.map((r) => ({ category: r._id, amount: r.total })),
      trend6m,
    };

    return ok(summary);
  } catch (err) {
    return serverError(err);
  }
}

import mongoose, { Schema, Model } from 'mongoose';
import type { Category } from '@/types';

export interface ExpenseDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  category: Category;
  date: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<ExpenseDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, lowercase: true, maxlength: 40 },
    date: { type: Date, required: true, index: true },
    note: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

ExpenseSchema.index({ userId: 1, date: -1 });

export const Expense: Model<ExpenseDoc> =
  (mongoose.models.Expense as Model<ExpenseDoc>) ||
  mongoose.model<ExpenseDoc>('Expense', ExpenseSchema);

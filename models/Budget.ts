import mongoose, { Schema, Model } from 'mongoose';
import type { Category } from '@/types';

export interface BudgetDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  category: Category;
  monthlyLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<BudgetDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true, trim: true, lowercase: true, maxlength: 40 },
    monthlyLimit: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

BudgetSchema.index({ userId: 1, category: 1 }, { unique: true });

export const Budget: Model<BudgetDoc> =
  (mongoose.models.Budget as Model<BudgetDoc>) ||
  mongoose.model<BudgetDoc>('Budget', BudgetSchema);

import mongoose, { Schema, Model } from 'mongoose';

export interface CategoryDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<CategoryDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, lowercase: true, maxlength: 40 },
  },
  { timestamps: true }
);

CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

export const Category: Model<CategoryDoc> =
  (mongoose.models.Category as Model<CategoryDoc>) ||
  mongoose.model<CategoryDoc>('Category', CategorySchema);

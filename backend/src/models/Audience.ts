import mongoose, { Schema, Document } from 'mongoose';

export interface IAudience extends Document {
  name: string;
  description?: string;
  filters: string;
  reasoning: string;
  customerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AudienceSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  filters: { type: String, required: true },
  reasoning: { type: String, required: true },
  customerCount: { type: Number, default: 0 },
}, { 
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret: any) => { ret.id = ret._id; delete ret._id; delete ret.__v; } },
});

export const Audience = (mongoose.models.Audience || mongoose.model<IAudience>('Audience', AudienceSchema)) as mongoose.Model<IAudience>;

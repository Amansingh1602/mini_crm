import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  age?: number;
  gender?: string;
  totalSpent: number;
  lastPurchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  city: { type: String, index: true },
  age: { type: Number },
  gender: { type: String },
  totalSpent: { type: Number, default: 0, index: true },
  lastPurchaseDate: { type: Date, index: true },
}, { 
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; } },
  toObject: { virtuals: true }
});

CustomerSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'customerId'
});

export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

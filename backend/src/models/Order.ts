import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  customerId: string | mongoose.Types.ObjectId;
  amount: number;
  category: string;
  createdAt: Date;
}

const OrderSchema: Schema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  amount: { type: Number, required: true, index: true },
  category: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
}, { 
  toJSON: { virtuals: true, transform: (_, ret: any) => { ret.id = ret._id; delete ret._id; delete ret.__v; } },
});

export const Order = (mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)) as mongoose.Model<IOrder>;

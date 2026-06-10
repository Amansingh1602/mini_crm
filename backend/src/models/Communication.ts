import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunication extends Document {
  campaignId: string | mongoose.Types.ObjectId;
  customerId: string | mongoose.Types.ObjectId;
  channel: string;
  message: string;
  status: string;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  openedAt?: Date;
  readAt?: Date;
  clickedAt?: Date;
  purchasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommunicationSchema: Schema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  channel: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: 'PENDING', index: true },
  sentAt: { type: Date },
  deliveredAt: { type: Date },
  failedAt: { type: Date },
  openedAt: { type: Date },
  readAt: { type: Date },
  clickedAt: { type: Date },
  purchasedAt: { type: Date },
}, { 
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret: any) => { ret.id = ret._id; delete ret._id; delete ret.__v; } },
});

CommunicationSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

export const Communication = (mongoose.models.Communication || mongoose.model<ICommunication>('Communication', CommunicationSchema)) as mongoose.Model<ICommunication>;

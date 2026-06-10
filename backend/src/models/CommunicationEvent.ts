import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunicationEvent extends Document {
  communicationId: string | mongoose.Types.ObjectId;
  type: string;
  timestamp: Date;
  metadata?: string;
  idempotencyKey: string;
}

const CommunicationEventSchema: Schema = new Schema({
  communicationId: { type: Schema.Types.ObjectId, ref: 'Communication', required: true, index: true },
  type: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: { type: String },
  idempotencyKey: { type: String, required: true, unique: true },
}, { 
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; } },
});

export const CommunicationEvent = mongoose.models.CommunicationEvent || mongoose.model<ICommunicationEvent>('CommunicationEvent', CommunicationEventSchema);

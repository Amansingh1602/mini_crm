import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaignAnalytics extends Document {
  campaignId: string | mongoose.Types.ObjectId;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  read: number;
  clicked: number;
  purchased: number;
  revenue: number;
  updatedAt: Date;
}

const CampaignAnalyticsSchema: Schema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, unique: true },
  total: { type: Number, default: 0 },
  sent: { type: Number, default: 0 },
  delivered: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  opened: { type: Number, default: 0 },
  read: { type: Number, default: 0 },
  clicked: { type: Number, default: 0 },
  purchased: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
}, { 
  timestamps: { createdAt: false, updatedAt: true },
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; } },
});

export const CampaignAnalytics = mongoose.models.CampaignAnalytics || mongoose.model<ICampaignAnalytics>('CampaignAnalytics', CampaignAnalyticsSchema);

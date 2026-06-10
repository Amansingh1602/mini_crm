import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaignInsight extends Document {
  campaignId: string | mongoose.Types.ObjectId;
  insight: string;
  category: string;
  severity: string;
  recommendation: string;
  createdAt: Date;
}

const CampaignInsightSchema: Schema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  insight: { type: String, required: true },
  category: { type: String, required: true },
  severity: { type: String, required: true },
  recommendation: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { 
  toJSON: { virtuals: true, transform: (_, ret: any) => { ret.id = ret._id; delete ret._id; delete ret.__v; } },
});

export const CampaignInsight = (mongoose.models.CampaignInsight || mongoose.model<ICampaignInsight>('CampaignInsight', CampaignInsightSchema)) as mongoose.Model<ICampaignInsight>;

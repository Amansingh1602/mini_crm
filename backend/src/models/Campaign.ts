import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  audienceId: string | mongoose.Types.ObjectId;
  title: string;
  goal: string;
  offer?: string;
  message: string;
  cta?: string;
  channel: string;
  status: string;
  predictedMetrics?: string;
  audienceReasoning?: string;
  messageReasoning?: string;
  channelReasoning?: string;
  offerReasoning?: string;
  scheduledAt?: Date;
  launchedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema: Schema = new Schema({
  audienceId: { type: Schema.Types.ObjectId, ref: 'Audience', required: true, index: true },
  title: { type: String, required: true },
  goal: { type: String, required: true },
  offer: { type: String },
  message: { type: String, required: true },
  cta: { type: String },
  channel: { type: String, required: true, index: true },
  status: { type: String, default: 'DRAFT', index: true },
  predictedMetrics: { type: String },
  audienceReasoning: { type: String },
  messageReasoning: { type: String },
  channelReasoning: { type: String },
  offerReasoning: { type: String },
  scheduledAt: { type: Date },
  launchedAt: { type: Date },
  completedAt: { type: Date },
}, { 
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret: any) => { ret.id = ret._id; delete ret._id; delete ret.__v; } },
});

CampaignSchema.virtual('audience', {
  ref: 'Audience',
  localField: 'audienceId',
  foreignField: '_id',
  justOne: true
});

CampaignSchema.virtual('communications', {
  ref: 'Communication',
  localField: '_id',
  foreignField: 'campaignId'
});

CampaignSchema.virtual('analytics', {
  ref: 'CampaignAnalytics',
  localField: '_id',
  foreignField: 'campaignId',
  justOne: true
});

CampaignSchema.virtual('insights', {
  ref: 'CampaignInsight',
  localField: '_id',
  foreignField: 'campaignId'
});

export const Campaign = (mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema)) as mongoose.Model<ICampaign>;

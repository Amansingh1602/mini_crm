"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Campaign = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CampaignSchema = new mongoose_1.Schema({
    audienceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Audience', required: true, index: true },
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
    toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; } },
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
exports.Campaign = mongoose_1.default.models.Campaign || mongoose_1.default.model('Campaign', CampaignSchema);
//# sourceMappingURL=Campaign.js.map
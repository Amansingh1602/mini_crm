import { Audience } from '../models/Audience';
import { Customer } from '../models/Customer';
import { Campaign } from '../models/Campaign';
import { generateAudience, buildWhereClause } from './ai.service';

export class AudienceService {
  static async generateAudienceFromQuery(query: string) {
    const result = await generateAudience(query);

    const audience = await Audience.create({
      name: result.name,
      description: result.description,
      filters: result.filters,
      reasoning: result.reasoning,
      customerCount: result.estimatedCount,
    });

    return {
      ...audience.toObject(),
      estimatedCount: result.estimatedCount,
    };
  }

  static async getAllAudiences() {
    const audiences = await Audience.find().sort({ createdAt: -1 });
    
    return Promise.all(
      audiences.map(async (aud) => {
        const obj = aud.toObject() as any;
        const count = await Campaign.countDocuments({ audienceId: aud._id });
        obj._count = { campaigns: count };
        return obj;
      })
    );
  }

  static async getAudienceById(id: string) {
    const audience = await Audience.findById(id);
    if (!audience) return null;

    const campaigns = await Campaign.find({ audienceId: audience._id }).sort({ createdAt: -1 });

    const whereClause = buildWhereClause(audience.filters);
    const customers = await Customer.find(whereClause)
      .sort({ totalSpent: -1 })
      .limit(50)
      .select('name email city totalSpent lastPurchaseDate');

    const totalCount = await Customer.countDocuments(whereClause);

    return {
      ...audience.toObject(),
      campaigns,
      customerCount: totalCount,
      sampleCustomers: customers,
    };
  }

  static async deleteAudience(id: string) {
    const result = await Audience.findByIdAndDelete(id);
    return result !== null;
  }
}

import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { logger } from '../lib/logger';
import { CustomerQuery } from '../types';
import { faker } from '@faker-js/faker';

export class CustomerService {
  static async getCustomers(query: CustomerQuery) {
    const { page = 1, limit = 20, search, city, sortBy = 'totalSpent', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (city) where.city = { $regex: new RegExp(`^${city}$`, 'i') };

    const sortConfig: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const customers = await Customer.aggregate([
      { $match: where },
      { $sort: sortConfig },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'customerId',
          as: 'orders'
        }
      },
      { $addFields: { _count: { orders: { $size: '$orders' } } } },
      { $project: { orders: 0 } }
    ]);

    const total = await Customer.countDocuments(where);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getCustomerById(id: string) {
    const customer = await Customer.findById(id)
      .populate({ path: 'orders', options: { sort: { createdAt: -1 }, limit: 20 } })
      .populate({ 
        path: 'communications', 
        options: { sort: { createdAt: -1 }, limit: 10 },
        populate: { path: 'campaignId', select: 'title' }
      });

    if (!customer) return null;

    const orderCount = await Order.countDocuments({ customerId: customer._id });

    const data = customer.toObject();
    data._count = { orders: orderCount, communications: (data as any).communications?.length || 0 };
    return data;
  }

  static async uploadCustomers(buffer: Buffer) {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          let processed = 0;
          for (const row of results) {
            if (!row.email) continue;
            
            await Customer.findOneAndUpdate(
              { email: row.email },
              {
                name: row.name || row.email.split('@')[0],
                email: row.email,
                phone: row.phone || null,
                city: row.city || null,
                totalSpent: parseFloat(row.totalSpent) || 0,
                lastPurchaseDate: row.lastPurchaseDate ? new Date(row.lastPurchaseDate) : null,
              },
              { upsert: true, new: true }
            );
            processed++;
          }
          logger.info(`Processed ${processed} customers from CSV`);
          resolve({ processed });
        })
        .on('error', reject);
    });
  }

  static async seedCustomersAndOrders(count: number) {
    await Customer.deleteMany({});
    await Order.deleteMany({});

    const customers = [];
    const orders = [];
    const categories = ['Electronics', 'Clothing', 'Home', 'Beauty', 'Sports'];

    for (let i = 0; i < count; i++) {
      const customerId = faker.database.mongodbObjectId();
      const numOrders = faker.number.int({ min: 0, max: 10 });
      let totalSpent = 0;
      let lastPurchaseDate = null;

      for (let j = 0; j < numOrders; j++) {
        const amount = faker.number.float({ min: 10, max: 1000, fractionDigits: 2 });
        totalSpent += amount;
        const orderDate = faker.date.past({ years: 1 });
        if (!lastPurchaseDate || orderDate > lastPurchaseDate) {
          lastPurchaseDate = orderDate;
        }

        orders.push({
          customerId,
          amount,
          category: faker.helpers.arrayElement(categories),
          createdAt: orderDate,
        });
      }

      customers.push({
        _id: customerId,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        city: faker.location.city(),
        age: faker.number.int({ min: 18, max: 80 }),
        gender: faker.helpers.arrayElement(['male', 'female', 'other']),
        totalSpent,
        lastPurchaseDate,
      });
    }

    await Customer.insertMany(customers);
    if (orders.length > 0) {
      await Order.insertMany(orders);
    }
    
    return { customers: count, orders: orders.length };
  }
}
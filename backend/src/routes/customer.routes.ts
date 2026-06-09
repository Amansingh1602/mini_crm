import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, validate, NotFoundError } from '../middleware/error';
import { logger } from '../lib/logger';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Schemas ──────────────────────────────────────────────

const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  city: z.string().optional(),
  sortBy: z.enum(['name', 'totalSpent', 'lastPurchaseDate', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── GET /api/customers ───────────────────────────────────

router.get(
  '/',
  validate(customerQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, search, city, sortBy, sortOrder } = req.query as any;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (city) where.city = { equals: city, mode: 'insensitive' };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { _count: { select: { orders: true } } },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// ─── GET /api/customers/:id ───────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 20 },
        communications: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { campaign: { select: { title: true } } },
        },
        _count: { select: { orders: true, communications: true } },
      },
    });

    if (!customer) throw new NotFoundError('Customer', req.params.id);

    res.json({ success: true, data: customer });
  })
);

// ─── POST /api/customers/upload ───────────────────────────

router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const records: any[] = [];
    const errors: string[] = [];
    let rowNumber = 0;

    const parser = Readable.from(req.file.buffer).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    );

    for await (const record of parser) {
      rowNumber++;
      try {
        const customer = {
          name: record.name?.trim(),
          email: record.email?.trim()?.toLowerCase(),
          phone: record.phone?.trim() || null,
          city: record.city?.trim() || null,
          age: record.age ? parseInt(record.age, 10) : null,
          gender: record.gender?.trim() || null,
          totalSpent: record.totalSpent ? parseFloat(record.totalSpent) : 0,
          lastPurchaseDate: record.lastPurchaseDate ? new Date(record.lastPurchaseDate) : null,
        };

        if (!customer.name || !customer.email) {
          errors.push(`Row ${rowNumber}: Missing required fields (name, email)`);
          continue;
        }

        records.push(customer);
      } catch (err) {
        errors.push(`Row ${rowNumber}: Invalid data format`);
      }
    }

    // Upsert in batches
    let created = 0;
    let updated = 0;

    for (const record of records) {
      try {
        await prisma.customer.upsert({
          where: { email: record.email },
          create: record,
          update: record,
        });
        created++;
      } catch (err: any) {
        if (err.code === 'P2002') {
          updated++;
        } else {
          errors.push(`Failed to insert ${record.email}: ${err.message}`);
        }
      }
    }

    logger.info({ created, updated, errors: errors.length }, 'CSV upload completed');

    res.json({
      success: true,
      data: {
        processed: rowNumber,
        created,
        updated,
        errors: errors.length,
        errorDetails: errors.slice(0, 10), // Return first 10 errors
      },
    });
  })
);

// ─── POST /api/customers/seed ─────────────────────────────

router.post(
  '/seed',
  asyncHandler(async (req, res) => {
    const count = Math.min(parseInt(req.body.count || '500', 10), 2000);

    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Jaipur', 'Ahmedabad', 'Lucknow'];
    const genders = ['Male', 'Female', 'Other'];
    const categories = ['Electronics', 'Fashion', 'Beauty', 'Home & Kitchen', 'Sports', 'Books', 'Food & Beverages', 'Health', 'Toys', 'Automotive'];
    const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Ananya', 'Diya', 'Myra', 'Sara', 'Aanya', 'Aadhya', 'Ira', 'Anika', 'Priya', 'Riya', 'Neha', 'Pooja', 'Shreya', 'Tanvi', 'Meera', 'Kabir', 'Rohan', 'Arnav', 'Dhruv', 'Yash'];
    const lastNames = ['Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Reddy', 'Iyer', 'Nair', 'Das', 'Joshi', 'Mehta', 'Shah', 'Rao', 'Malhotra', 'Chopra', 'Kapoor', 'Bhat', 'Mukherjee', 'Agarwal'];

    const customers = [];
    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
      const daysAgo = Math.floor(Math.random() * 365);
      const totalSpent = Math.round((Math.random() * 50000 + 500) * 100) / 100;

      customers.push({
        name,
        email,
        phone: `+91${Math.floor(7000000000 + Math.random() * 3000000000)}`,
        city: cities[Math.floor(Math.random() * cities.length)],
        age: Math.floor(Math.random() * 45) + 18,
        gender: genders[Math.floor(Math.random() * genders.length)],
        totalSpent,
        lastPurchaseDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      });
    }

    // Batch create
    const result = await prisma.customer.createMany({
      data: customers,
      skipDuplicates: true,
    });

    // Generate orders for each customer
    const allCustomers = await prisma.customer.findMany({ select: { id: true } });
    const orders = [];

    for (const customer of allCustomers) {
      const orderCount = Math.floor(Math.random() * 8) + 1;
      for (let j = 0; j < orderCount; j++) {
        orders.push({
          customerId: customer.id,
          amount: Math.round((Math.random() * 10000 + 200) * 100) / 100,
          category: categories[Math.floor(Math.random() * categories.length)],
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000),
        });
      }
    }

    await prisma.order.createMany({ data: orders });

    logger.info({ customers: result.count, orders: orders.length }, 'Seed data generated');

    res.json({
      success: true,
      data: {
        customersCreated: result.count,
        ordersCreated: orders.length,
      },
    });
  })
);

export default router;

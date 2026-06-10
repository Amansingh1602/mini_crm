"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const csv_parse_1 = require("csv-parse");
const stream_1 = require("stream");
const Customer_1 = require("../models/Customer");
const Order_1 = require("../models/Order");
const logger_1 = require("../lib/logger");
class CustomerService {
    static async getCustomers(query) {
        const { page, limit, search, city, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (city)
            where.city = { $regex: new RegExp(`^${city}$`, 'i') };
        const sortConfig = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
        const customers = await Customer_1.Customer.aggregate([
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
        const total = await Customer_1.Customer.countDocuments(where);
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
    static async getCustomerById(id) {
        const customer = await Customer_1.Customer.findById(id)
            .populate({ path: 'orders', options: { sort: { createdAt: -1 }, limit: 20 } })
            .populate({
            path: 'communications',
            options: { sort: { createdAt: -1 }, limit: 10 },
            populate: { path: 'campaignId', select: 'title' }
        });
        if (!customer)
            return null;
        const orderCount = await Order_1.Order.countDocuments({ customerId: customer._id });
        const data = customer.toObject();
        data._count = { orders: orderCount, communications: data.communications?.length || 0 };
        return data;
    }
    static async uploadCustomers(fileBuffer) {
        const records = [];
        const errors = [];
        let rowNumber = 0;
        const parser = stream_1.Readable.from(fileBuffer).pipe((0, csv_parse_1.parse)({ columns: true, skip_empty_lines: true, trim: true }));
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
            }
            catch (err) {
                errors.push(`Row ${rowNumber}: Invalid data format`);
            }
        }
        let created = 0;
        let updated = 0;
        for (const record of records) {
            try {
                const existing = await Customer_1.Customer.findOne({ email: record.email });
                if (existing) {
                    await Customer_1.Customer.updateOne({ email: record.email }, record);
                    updated++;
                }
                else {
                    await Customer_1.Customer.create(record);
                    created++;
                }
            }
            catch (err) {
                errors.push(`Failed to insert ${record.email}: ${err.message}`);
            }
        }
        logger_1.logger.info({ created, updated, errors: errors.length }, 'CSV upload completed');
        return {
            processed: rowNumber,
            created,
            updated,
            errors: errors.length,
            errorDetails: errors.slice(0, 10),
        };
    }
    static async seedCustomersAndOrders(count) {
        const safeCount = Math.min(count, 2000);
        const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Jaipur', 'Ahmedabad', 'Lucknow'];
        const genders = ['Male', 'Female', 'Other'];
        const categories = ['Electronics', 'Fashion', 'Beauty', 'Home & Kitchen', 'Sports', 'Books', 'Food & Beverages', 'Health', 'Toys', 'Automotive'];
        const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Ananya', 'Diya', 'Myra', 'Sara', 'Aanya', 'Aadhya', 'Ira', 'Anika', 'Priya', 'Riya', 'Neha', 'Pooja', 'Shreya', 'Tanvi', 'Meera', 'Kabir', 'Rohan', 'Arnav', 'Dhruv', 'Yash'];
        const lastNames = ['Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Reddy', 'Iyer', 'Nair', 'Das', 'Joshi', 'Mehta', 'Shah', 'Rao', 'Malhotra', 'Chopra', 'Kapoor', 'Bhat', 'Mukherjee', 'Agarwal'];
        const customers = [];
        for (let i = 0; i < safeCount; i++) {
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
        let createdCount = 0;
        try {
            const result = await Customer_1.Customer.insertMany(customers, { ordered: false });
            createdCount = result.length;
        }
        catch (err) {
            if (err.insertedDocs)
                createdCount = err.insertedDocs.length;
        }
        const allCustomers = await Customer_1.Customer.find().select('_id');
        const orders = [];
        for (const customer of allCustomers) {
            const orderCount = Math.floor(Math.random() * 8) + 1;
            for (let j = 0; j < orderCount; j++) {
                orders.push({
                    customerId: customer._id,
                    amount: Math.round((Math.random() * 10000 + 200) * 100) / 100,
                    category: categories[Math.floor(Math.random() * categories.length)],
                    createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000),
                });
            }
        }
        await Order_1.Order.insertMany(orders);
        logger_1.logger.info({ customers: createdCount, orders: orders.length }, 'Seed data generated');
        return {
            customersCreated: createdCount,
            ordersCreated: orders.length,
        };
    }
}
exports.CustomerService = CustomerService;
//# sourceMappingURL=customer.service.js.map
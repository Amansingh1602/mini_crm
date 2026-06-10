"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const Order_1 = require("../models/Order");
class OrderService {
    static async getOrders(query) {
        const { page, limit, customerId, category, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (customerId)
            where.customerId = customerId;
        if (category)
            where.category = { $regex: new RegExp(`^${category}$`, 'i') };
        const sortConfig = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
        const [orders, total] = await Promise.all([
            Order_1.Order.find(where)
                .sort(sortConfig)
                .skip(skip)
                .limit(limit)
                .populate('customerId', 'name email'),
            Order_1.Order.countDocuments(where),
        ]);
        const formattedOrders = orders.map((order) => {
            const obj = order.toObject();
            obj.customer = obj.customerId;
            delete obj.customerId;
            return obj;
        });
        return {
            orders: formattedOrders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    static async getStats() {
        const [totalOrders, amountAgg, categoryStats] = await Promise.all([
            Order_1.Order.countDocuments(),
            Order_1.Order.aggregate([{ $group: { _id: null, totalAmount: { $sum: "$amount" } } }]),
            Order_1.Order.aggregate([
                { $group: { _id: "$category", count: { $sum: 1 }, sumAmount: { $sum: "$amount" }, avgAmount: { $avg: "$amount" } } },
                { $sort: { sumAmount: -1 } },
                { $project: { category: "$_id", _count: "$count", _sum: { amount: "$sumAmount" }, _avg: { amount: "$avgAmount" }, _id: 0 } }
            ])
        ]);
        return {
            totalOrders,
            totalRevenue: amountAgg.length > 0 ? amountAgg[0].totalAmount : 0,
            categories: categoryStats,
        };
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=order.service.js.map
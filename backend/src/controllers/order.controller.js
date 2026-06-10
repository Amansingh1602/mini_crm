"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const order_service_1 = require("../services/order.service");
class OrderController {
    static async getAll(req, res) {
        const query = req.query;
        const data = await order_service_1.OrderService.getOrders(query);
        res.json({
            success: true,
            data: data.orders,
            pagination: data.pagination,
        });
    }
    static async getStats(_req, res) {
        const data = await order_service_1.OrderService.getStats();
        res.json({ success: true, data });
    }
}
exports.OrderController = OrderController;
//# sourceMappingURL=order.controller.js.map
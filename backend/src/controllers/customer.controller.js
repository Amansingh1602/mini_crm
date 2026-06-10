"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const customer_service_1 = require("../services/customer.service");
const error_1 = require("../middleware/error");
class CustomerController {
    static async getAll(req, res) {
        const query = req.query;
        const result = await customer_service_1.CustomerService.getCustomers(query);
        res.json({
            success: true,
            data: result.customers,
            pagination: result.pagination,
        });
    }
    static async getById(req, res) {
        const data = await customer_service_1.CustomerService.getCustomerById(req.params.id);
        if (!data)
            throw new error_1.NotFoundError('Customer', req.params.id);
        res.json({ success: true, data });
    }
    static async upload(req, res) {
        if (!req.file) {
            res.status(400).json({ success: false, error: 'No file uploaded' });
            return;
        }
        const data = await customer_service_1.CustomerService.uploadCustomers(req.file.buffer);
        res.json({ success: true, data });
    }
    static async seed(req, res) {
        const count = parseInt(req.body.count || '500', 10);
        const data = await customer_service_1.CustomerService.seedCustomersAndOrders(count);
        res.json({ success: true, data });
    }
}
exports.CustomerController = CustomerController;
//# sourceMappingURL=customer.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const order_controller_1 = require("../controllers/order.controller");
const error_1 = require("../middleware/error");
const router = (0, express_1.Router)();
const orderQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    customerId: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['amount', 'createdAt', 'category']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
router.get('/', (0, error_1.validate)(orderQuerySchema, 'query'), (0, error_1.asyncHandler)(order_controller_1.OrderController.getAll));
router.get('/stats', (0, error_1.asyncHandler)(order_controller_1.OrderController.getStats));
exports.default = router;
//# sourceMappingURL=order.routes.js.map
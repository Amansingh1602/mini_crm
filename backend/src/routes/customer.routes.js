"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const customer_controller_1 = require("../controllers/customer.controller");
const error_1 = require("../middleware/error");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const customerQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['name', 'totalSpent', 'lastPurchaseDate', 'createdAt']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
router.get('/', (0, error_1.validate)(customerQuerySchema, 'query'), (0, error_1.asyncHandler)(customer_controller_1.CustomerController.getAll));
router.get('/:id', (0, error_1.asyncHandler)(customer_controller_1.CustomerController.getById));
router.post('/upload', upload.single('file'), (0, error_1.asyncHandler)(customer_controller_1.CustomerController.upload));
router.post('/seed', (0, error_1.asyncHandler)(customer_controller_1.CustomerController.seed));
exports.default = router;
//# sourceMappingURL=customer.routes.js.map
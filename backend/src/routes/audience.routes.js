"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const audience_controller_1 = require("../controllers/audience.controller");
const error_1 = require("../middleware/error");
const rateLimit_1 = require("../middleware/rateLimit");
const router = (0, express_1.Router)();
router.post('/generate', rateLimit_1.aiLimiter, (0, error_1.validate)(zod_1.z.object({ query: zod_1.z.string().min(5).max(500) })), (0, error_1.asyncHandler)(audience_controller_1.AudienceController.generate));
router.get('/', (0, error_1.asyncHandler)(audience_controller_1.AudienceController.getAll));
router.get('/:id', (0, error_1.asyncHandler)(audience_controller_1.AudienceController.getById));
router.delete('/:id', (0, error_1.asyncHandler)(audience_controller_1.AudienceController.delete));
exports.default = router;
//# sourceMappingURL=audience.routes.js.map
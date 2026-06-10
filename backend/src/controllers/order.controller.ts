import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { OrderQuery } from '../types';

export class OrderController {
  static async getAll(req: Request, res: Response) {
    const query = req.query as unknown as OrderQuery;
    const data = await OrderService.getOrders(query);
    res.json({
      success: true,
      data: data.orders,
      pagination: data.pagination,
    });
  }

  static async getStats(_req: Request, res: Response) {
    const data = await OrderService.getStats();
    res.json({ success: true, data });
  }
}

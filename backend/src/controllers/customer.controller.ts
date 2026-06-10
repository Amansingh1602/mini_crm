import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { NotFoundError } from '../middleware/error';
import { CustomerQuery } from '../types';

export class CustomerController {
  static async getAll(req: Request, res: Response) {
    const query = req.query as unknown as CustomerQuery;
    const result = await CustomerService.getCustomers(query);
    res.json({
      success: true,
      data: result.customers,
      pagination: result.pagination,
    });
  }

  static async getById(req: Request, res: Response) {
    const data = await CustomerService.getCustomerById(req.params.id);
    if (!data) throw new NotFoundError('Customer', req.params.id);
    res.json({ success: true, data });
  }

  static async upload(req: Request, res: Response) {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }
    const data = await CustomerService.uploadCustomers(req.file.buffer);
    res.json({ success: true, data });
  }

  static async seed(req: Request, res: Response) {
    const count = parseInt(req.body.count || '500', 10);
    const data = await CustomerService.seedCustomersAndOrders(count);
    res.json({ success: true, data });
  }
}

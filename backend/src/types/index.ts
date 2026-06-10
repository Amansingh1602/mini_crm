import { Request } from 'express';

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface CustomerQuery extends PaginationQuery {
  search?: string;
  city?: string;
  sortBy: 'name' | 'totalSpent' | 'lastPurchaseDate' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

export interface OrderQuery extends PaginationQuery {
  customerId?: string;
  category?: string;
  sortBy: 'amount' | 'createdAt' | 'category';
  sortOrder: 'asc' | 'desc';
}

export interface TypedRequestQuery<T> extends Request {
  query: T & Partial<Record<string, string | string[]>>;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationResult;
}

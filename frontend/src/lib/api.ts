const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'Request failed', data.code);
  }

  return data;
}

// ─── Customer APIs ────────────────────────────────────────

export const customerApi = {
  list: (params?: { page?: number; limit?: number; search?: string; city?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any>(`/customers?${query}`);
  },
  getById: (id: string) => request<any>(`/customers/${id}`),
  seed: (count = 500) => request<any>('/customers/seed', { method: 'POST', body: { count } }),
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/customers/upload`, { method: 'POST', body: formData });
    return response.json();
  },
};

// ─── Order APIs ───────────────────────────────────────────

export const orderApi = {
  list: (params?: { page?: number; limit?: number; customerId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any>(`/orders?${query}`);
  },
  stats: () => request<any>('/orders/stats'),
};

// ─── Audience APIs ────────────────────────────────────────

export const audienceApi = {
  generate: (query: string) =>
    request<any>('/audiences/generate', { method: 'POST', body: { query } }),
  list: () => request<any>('/audiences'),
  getById: (id: string) => request<any>(`/audiences/${id}`),
  delete: (id: string) => request<any>(`/audiences/${id}`, { method: 'DELETE' }),
};

// ─── Campaign APIs ────────────────────────────────────────

export const campaignApi = {
  generate: (goal: string, audienceId?: string) =>
    request<any>('/campaigns/generate', { method: 'POST', body: { goal, audienceId } }),
  autonomous: (goal: string) =>
    request<any>('/campaigns/autonomous', { method: 'POST', body: { goal } }),
  list: () => request<any>('/campaigns'),
  getById: (id: string) => request<any>(`/campaigns/${id}`),
  approve: (id: string) => request<any>(`/campaigns/${id}/approve`, { method: 'POST' }),
  launch: (id: string) => request<any>(`/campaigns/${id}/launch`, { method: 'POST' }),
  insights: (id: string) => request<any>(`/campaigns/${id}/insights`, { method: 'POST' }),
};

// ─── Analytics APIs ───────────────────────────────────────

export const analyticsApi = {
  dashboard: () => request<any>('/analytics/dashboard'),
  campaign: (id: string) => request<any>(`/analytics/campaigns/${id}`),
  channels: () => request<any>('/analytics/channels'),
};

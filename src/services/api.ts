// Frontend API Service
// Handles communication with the Express backend

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface ApiCategory {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string | null;
  color?: string | null;
}

export interface ApiTransaction {
  id: string;
  merchant: string;
  category: string;
  categoryId?: string | null;
  date: string;
  amount: number;
  currencyCode: string;
  type: 'income' | 'expense';
  account: string;
}

export interface CreateTransactionPayload {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  currencyCode?: string;
  categoryId?: string | null;
  description?: string | null;
  date: string;
}

export interface UpdateTransactionPayload {
  type?: 'INCOME' | 'EXPENSE';
  amount?: number;
  currencyCode?: string;
  categoryId?: string | null;
  description?: string | null;
  date?: string;
}

export interface TransactionFilterParams {
  type?: 'INCOME' | 'EXPENSE' | 'income' | 'expense' | 'All';
  categoryId?: string;
  currencyCode?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  page?: number;
}

export interface ApiBudget {
  id: string;
  category: string;
  categoryId?: string | null;
  limit: number;
  currencyCode: string;
}

export interface ApiGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  currencyCode: string;
  date: string;
  color: string;
}

export interface ApiSummary {
  period: { year: number; month: number };
  preferredCurrency: string;
  activeCurrency: string;
  byCurrency: Record<string, { income: number; expense: number; balance: number; transactionCount: number }>;
  savingsByCurrency: Record<string, number>;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  totalSaved: number;
  savingsGoalCount: number;
}

export class ApiService {
  static async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('spendwise-token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    if (!response.ok) {
      const msg = data.message || 'API Request failed';
      // If it is a Zod validation error, include the first field error for context
      if (data.errors && typeof data.errors === 'object') {
        const firstField = Object.keys(data.errors)[0];
        const firstMsg = data.errors[firstField]?.[0];
        if (firstField && firstMsg) {
          throw new Error(`${response.status}: ${firstField}: ${firstMsg}`);
        }
      }
      throw new Error(`${response.status}: ${msg}`);
    }
    return data.data || data;
  }

  // --- Auth ---
  static login(credentials: Record<string, unknown>) { return this.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }); }
  static register(userData: Record<string, unknown>) { return this.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }); }
  static getMe() { return this.request('/auth/me'); }
  static updateUser(data: { name?: string; email?: string; preferredCurrency?: string }) {
    return this.request('/users/me', { method: 'PATCH', body: JSON.stringify(data) });
  }
  static logout() { return this.request('/auth/logout', { method: 'POST' }); }

  // --- Categories ---
  static async getCategories(): Promise<ApiCategory[]> { 
    const result = await this.request('/categories'); 
    return (result.categories || result || []) as ApiCategory[];
  }
  static createCategory(data: { name: string; type: 'INCOME' | 'EXPENSE'; icon?: string; color?: string }) {
    return this.request('/categories', { method: 'POST', body: JSON.stringify(data) });
  }

  // --- Transactions ---
  // Maps backend response to frontend UI type
  static async getTransactions(params?: string | TransactionFilterParams): Promise<ApiTransaction[]> { 
    let queryString = '';
    if (typeof params === 'string') {
      queryString = params ? (params.startsWith('?') ? params : `?${params}`) : '?limit=1000';
    } else if (params && typeof params === 'object') {
      const sp = new URLSearchParams();
      if (params.type && params.type !== 'All') sp.append('type', params.type.toUpperCase());
      if (params.categoryId && params.categoryId !== 'All') sp.append('categoryId', params.categoryId);
      if (params.currencyCode && params.currencyCode !== 'ALL') sp.append('currencyCode', params.currencyCode);
      if (params.startDate) sp.append('startDate', params.startDate);
      if (params.endDate) sp.append('endDate', params.endDate);
      if (params.search) sp.append('search', params.search);
      sp.append('limit', String(params.limit ?? 1000));
      if (params.page) sp.append('page', String(params.page));
      queryString = `?${sp.toString()}`;
    } else {
      queryString = '?limit=1000';
    }

    const result = await this.request(`/transactions${queryString}`); 
    const list = (result.data || result || []) as Array<{
      id: string;
      description?: string | null;
      category?: { name?: string } | null;
      categoryId?: string | null;
      date: string;
      amount: string | number;
      currencyCode?: string;
      type: 'INCOME' | 'EXPENSE';
    }>;

    return list.map((item) => ({
      id: item.id,
      merchant: item.description || 'Unknown',
      category: item.category?.name || 'Uncategorized',
      categoryId: item.categoryId ?? undefined,
      date: typeof item.date === 'string' ? item.date.split('T')[0] : new Date(item.date).toISOString().split('T')[0],
      amount: Number(item.amount),
      currencyCode: item.currencyCode || 'INR',
      type: item.type.toLowerCase() as 'income' | 'expense',
      account: 'Checking'
    }));
  }
  
  static async createTransaction(data: CreateTransactionPayload): Promise<ApiTransaction> { 
    const result = await this.request('/transactions', { method: 'POST', body: JSON.stringify(data) }); 
    const item = result.transaction || result;
    return {
      id: item.id,
      merchant: item.description || 'Unknown',
      category: item.category?.name || 'Uncategorized',
      categoryId: item.categoryId ?? undefined,
      date: typeof item.date === 'string' ? item.date.split('T')[0] : new Date(item.date).toISOString().split('T')[0],
      amount: Number(item.amount),
      currencyCode: item.currencyCode || 'INR',
      type: item.type.toLowerCase() as 'income' | 'expense',
      account: 'Checking'
    };
  }
  
  static async updateTransaction(id: string, data: UpdateTransactionPayload): Promise<ApiTransaction> { 
    const result = await this.request(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); 
    const item = result.transaction || result;
    return {
      id: item.id,
      merchant: item.description || 'Unknown',
      category: item.category?.name || 'Uncategorized',
      categoryId: item.categoryId ?? undefined,
      date: typeof item.date === 'string' ? item.date.split('T')[0] : new Date(item.date).toISOString().split('T')[0],
      amount: Number(item.amount),
      currencyCode: item.currencyCode || 'INR',
      type: item.type.toLowerCase() as 'income' | 'expense',
      account: 'Checking'
    };
  }
  
  static deleteTransaction(id: string): Promise<void> {
    return this.request(`/transactions/${id}`, { method: 'DELETE' });
  }
  
  // --- Budgets ---
  static async getBudgets(): Promise<ApiBudget[]> { 
    const result = await this.request('/budgets'); 
    return (result.budgets || []).map((item: any) => ({
      id: item.id,
      category: item.category?.name || 'Uncategorized',
      categoryId: item.categoryId,
      limit: Number(item.amount),
      currencyCode: item.currencyCode || 'INR'
    }));
  }
  
  static createBudget(data: { categoryId?: string | null; amount: number; currencyCode?: string; period?: string; startDate?: string; endDate?: string | null }) {
    return this.request('/budgets', { method: 'POST', body: JSON.stringify(data) });
  }
  static deleteBudget(id: string) { return this.request(`/budgets/${id}`, { method: 'DELETE' }); }

  // --- Savings Goals ---
  static async getGoals(): Promise<ApiGoal[]> {
    const result = await this.request('/savings-goals');
    return (result.goals || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      target: Number(item.targetAmount),
      saved: Number(item.currentAmount),
      currencyCode: item.currencyCode || 'INR',
      date: item.targetDate ? item.targetDate.split('T')[0] : '',
      color: '#22a06b' // default color
    }));
  }

  static createGoal(data: { name: string; targetAmount: number; currentAmount?: number; currencyCode?: string; targetDate?: string | null }) {
    return this.request('/savings-goals', { method: 'POST', body: JSON.stringify(data) });
  }
  static updateGoal(id: string, data: any) { return this.request(`/savings-goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  static deleteGoal(id: string) { return this.request(`/savings-goals/${id}`, { method: 'DELETE' }); }

  // --- Analytics ---
  static getSummary(year?: number, month?: number, currencyCode?: string): Promise<ApiSummary> {
    const sp = new URLSearchParams();
    if (year !== undefined) sp.append('year', String(year));
    if (month !== undefined) sp.append('month', String(month));
    if (currencyCode) sp.append('currencyCode', currencyCode);
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return this.request(`/analytics/summary${qs}`);
  }
  
  static getMonthly(months?: number, currencyCode?: string) {
    const sp = new URLSearchParams();
    if (months !== undefined) sp.append('months', String(months));
    if (currencyCode) sp.append('currencyCode', currencyCode);
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return this.request(`/analytics/monthly${qs}`);
  }

  static getCategoryAnalytics(startDate?: string, endDate?: string, currencyCode?: string) {
    const sp = new URLSearchParams();
    if (startDate) sp.append('startDate', startDate);
    if (endDate) sp.append('endDate', endDate);
    if (currencyCode) sp.append('currencyCode', currencyCode);
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return this.request(`/analytics/categories${qs}`);
  }

  static getBudgetProgress() { return this.request('/analytics/budget-progress'); }
  static getSavingsProgress() { return this.request('/analytics/savings-progress'); }

  // --- Notifications ---
  static getNotifications() { return this.request('/notifications'); }
  static markNotificationRead(id: string) { return this.request(`/notifications/${id}/read`, { method: 'PATCH' }); }
  static deleteNotification(id: string) { return this.request(`/notifications/${id}`, { method: 'DELETE' }); }

  // --- Insights ---
  static getInsights() { return this.request('/insights'); }

  // --- AI Assistant ---
  static async chatWithAI(
    message: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ) {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory }),
    });
  }

  static async getAISuggestions() {
    return this.request('/ai/suggestions');
  }
}

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
  type: 'income' | 'expense';
  account: string;
}

export interface CreateTransactionPayload {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryId?: string | null;
  description?: string | null;
  date: string;
}

export interface UpdateTransactionPayload {
  type?: 'INCOME' | 'EXPENSE';
  amount?: number;
  categoryId?: string | null;
  description?: string | null;
  date?: string;
}

export interface TransactionFilterParams {
  type?: 'INCOME' | 'EXPENSE' | 'income' | 'expense' | 'All';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  page?: number;
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

  // --- Auth & User Profile ---
  static login(credentials: Record<string, unknown>) { return this.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }); }
  static register(userData: Record<string, unknown>) { return this.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }); }
  static getMe() { return this.request('/auth/me'); }
  static updateProfile(data: { name?: string; email?: string }) { return this.request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }); }
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
      type: 'INCOME' | 'EXPENSE';
    }>;

    return list.map((item) => ({
      id: item.id,
      merchant: item.description || 'Unknown',
      category: item.category?.name || 'Uncategorized',
      categoryId: item.categoryId ?? undefined,
      date: typeof item.date === 'string' ? item.date.split('T')[0] : new Date(item.date).toISOString().split('T')[0],
      amount: Number(item.amount),
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
      type: item.type.toLowerCase() as 'income' | 'expense',
      account: 'Checking'
    };
  }
  
  static deleteTransaction(id: string): Promise<void> {
    return this.request(`/transactions/${id}`, { method: 'DELETE' });
  }
  
  // --- Budgets ---
  static async getBudgets() { 
    const result = await this.request('/budgets'); 
    return (result.budgets || []).map((item: any) => ({
      id: item.id,
      category: item.category?.name || 'Uncategorized',
      categoryId: item.categoryId,
      limit: Number(item.amount)
    }));
  }
  
  static createBudget(data: any) { return this.request('/budgets', { method: 'POST', body: JSON.stringify(data) }); }
  static deleteBudget(id: string) { return this.request(`/budgets/${id}`, { method: 'DELETE' }); }

  // --- Savings Goals ---
  static async getGoals() {
    const result = await this.request('/savings-goals');
    return (result.goals || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      target: Number(item.targetAmount),
      saved: Number(item.currentAmount),
      date: item.targetDate ? item.targetDate.split('T')[0] : '',
      color: '#22a06b' // default color
    }));
  }

  static createGoal(data: any) { return this.request('/savings-goals', { method: 'POST', body: JSON.stringify(data) }); }
  static updateGoal(id: string, data: any) { return this.request(`/savings-goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  static deleteGoal(id: string) { return this.request(`/savings-goals/${id}`, { method: 'DELETE' }); }

  // --- Analytics ---
  static getSummary() { return this.request('/analytics/summary'); }
  static getMonthly() { return this.request('/analytics/monthly'); }
  static getCategoryAnalytics() { return this.request('/analytics/categories'); }
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


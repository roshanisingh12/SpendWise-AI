// Frontend API Service
// Handles communication with the Express backend

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
      throw new Error(`${response.status}: ${msg}`);
    }
    return data.data || data;
  }

  // --- Auth ---
  static login(credentials: any) { return this.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }); }
  static register(userData: any) { return this.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }); }
  static getMe() { return this.request('/auth/me'); }
  static logout() { return this.request('/auth/logout', { method: 'POST' }); }

  // --- Categories ---
  static getCategories() { return this.request('/categories'); }

  // --- Transactions ---
  // Maps backend response to frontend UI type
  static async getTransactions(params = '') { 
    const result = await this.request(`/transactions${params ? '?' + params : '?limit=1000'}`); 
    return result.data.map((item: any) => ({
      id: item.id,
      merchant: item.description || 'Unknown',
      category: item.category?.name || 'Uncategorized',
      date: item.date.split('T')[0],
      amount: Number(item.amount),
      type: item.type.toLowerCase(),
      account: 'Checking'
    }));
  }
  
  static createTransaction(data: any) { return this.request('/transactions', { method: 'POST', body: JSON.stringify(data) }); }
  static updateTransaction(id: string, data: any) { return this.request(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  static deleteTransaction(id: string) { return this.request(`/transactions/${id}`, { method: 'DELETE' }); }
  
  // --- Budgets ---
  static async getBudgets() { 
    const result = await this.request('/budgets'); 
    return result.budgets.map((item: any) => ({
      id: item.id,
      category: item.category?.name || 'Uncategorized',
      limit: Number(item.amount)
    }));
  }
  
  static createBudget(data: any) { return this.request('/budgets', { method: 'POST', body: JSON.stringify(data) }); }
  static deleteBudget(id: string) { return this.request(`/budgets/${id}`, { method: 'DELETE' }); }

  // --- Savings Goals ---
  static async getGoals() {
    const result = await this.request('/savings-goals');
    return result.goals.map((item: any) => ({
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
}

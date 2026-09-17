// Frontend API Service stub
// This sets up the infrastructure for calling the backend without breaking existing mock UI

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export class ApiService {
  static async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
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
      throw new Error(data.message || 'API Request failed');
    }
    return data;
  }

  // --- Auth ---
  static login(credentials: any) { return this.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }); }
  static register(userData: any) { return this.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }); }
  static getMe() { return this.request('/auth/me'); }

  // --- Transactions ---
  static getTransactions(params = '') { return this.request(`/transactions${params ? '?' + params : ''}`); }
  static createTransaction(data: any) { return this.request('/transactions', { method: 'POST', body: JSON.stringify(data) }); }
  
  // --- Budgets ---
  static getBudgets() { return this.request('/budgets'); }

  // --- Analytics ---
  static getSummary() { return this.request('/analytics/summary'); }
  static getMonthly() { return this.request('/analytics/monthly'); }
  static getCategoryAnalytics() { return this.request('/analytics/categories'); }
}

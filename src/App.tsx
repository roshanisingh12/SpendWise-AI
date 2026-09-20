import { useEffect, useMemo, useRef, useState, useCallback, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import {
  ApiService,
  type ApiCategory,
  type ApiTransaction,
  type CreateTransactionPayload,
  type UpdateTransactionPayload,
} from './services/api';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CloudUpload,
  CreditCard,
  Database,
  Download,
  Filter,
  Gauge,
  LayoutDashboard,
  Lightbulb,
  ListFilter,
  Menu,
  Monitor,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  Wallet,
  X,
  Zap,
} from 'lucide-react';

type Theme = 'light' | 'dark';
type ThemePreference = Theme | 'system';
type Page = 'dashboard' | 'transactions' | 'analytics' | 'budgets' | 'savings' | 'assistant' | 'settings';
type Transaction = { id: string; merchant: string; category: string; categoryId?: string | null; date: string; amount: number; type: 'income' | 'expense'; account: string };
type Budget = { id: string; category: string; categoryId?: string | null; limit: number };
type Goal = { id: string; name: string; target: number; saved: number; date: string; color: string };

type IconType = typeof LayoutDashboard;

const categoryColors: Record<string, string> = { Housing: '#5078e5', Groceries: '#22a06b', Dining: '#f59e0b', Transport: '#a855f7', Subscriptions: '#ef6b73', Shopping: '#ef8354', Health: '#10b8b0', Education: '#64748b', Entertainment: '#e879f9', Income: '#22a06b' };
const categories = ['All', 'Housing', 'Groceries', 'Dining', 'Transport', 'Subscriptions', 'Shopping', 'Health', 'Education', 'Entertainment'];

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const preciseMoney = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const parseDateSafe = (value: string): Date => {
  if (!value) return new Date();
  if (value.includes('T')) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  const parts = value.split('-');
  if (parts.length >= 3) {
    const d = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}T12:00:00`);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  if (parts.length === 2) {
    const d = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-01T12:00:00`);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
};

const dateLabel = (value: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(parseDateSafe(value));
  } catch {
    return value;
  }
};

const monthLabel = (value: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(parseDateSafe(value));
  } catch {
    return value;
  }
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function useStoredState<T>(key: string, initial: T): [T, (value: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [key, value]);

  return [value, setValue];
}

function App() {
  const { user, loading, logout } = useAuth();
  const [theme, setTheme] = useStoredState<ThemePreference>('spendwise-theme', 'system');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoriesList, setCategoriesList] = useState<ApiCategory[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [page, setPage] = useState<Page>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [, setNotificationItems] = useState<any[]>([]);
  const [, setInsights] = useState<any[]>([]);
  const [modal, setModal] = useState<'transaction' | 'budget' | 'goal' | 'upload' | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [toast, setToast] = useState('');

  const loadUserData = useCallback(async () => {
    if (!user) return;
    setLoadingTransactions(true);
    setTransactionError(null);
    try {
      const [fetchedTx, fetchedCats, fetchedBudgets, fetchedGoals] = await Promise.all([
        ApiService.getTransactions(),
        ApiService.getCategories().catch(() => []),
        ApiService.getBudgets().catch(() => []),
        ApiService.getGoals().catch(() => []),
      ]);
      setTransactions(fetchedTx);
      setCategoriesList(fetchedCats);
      setBudgets(fetchedBudgets);
      setGoals(fetchedGoals);
    } catch (err: any) {
      console.error('Failed to load user financial data:', err);
      setTransactionError(err?.message || 'Failed to load transaction data.');
    } finally {
      setLoadingTransactions(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, loadUserData]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      document.documentElement.dataset.theme = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
    };
    applyTheme();
    if (theme !== 'system') return;
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const syncData = async () => {
    await loadUserData();
    setToast('Synced with server');
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ transactions, budgets, goals }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'spendwise-data.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setToast('Your data is ready to download');
  };

  const navigate = (next: Page) => {
    setPage(next);
    setMobileOpen(false);
  };

  const addTransaction = async (transaction: Transaction) => {
    try {
      const matchedCat = categoriesList.find(
        (c) => c.name.toLowerCase() === transaction.category.toLowerCase()
      );
      const payload: CreateTransactionPayload = {
        type: (transaction.type.toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE') as 'INCOME' | 'EXPENSE',
        amount: transaction.amount,
        categoryId: matchedCat?.id || transaction.categoryId || null,
        description: transaction.merchant,
        date: transaction.date,
      };
      const created = await ApiService.createTransaction(payload);
      setTransactions((current) => [created, ...current]);
      setModal(null);
      setToast('Transaction added successfully');
    } catch (err: any) {
      console.error('Failed to add transaction:', err);
      setToast(`Failed to add transaction: ${err?.message || 'Unknown error'}`);
      throw err;
    }
  };

  const saveTransaction = async (transaction: Transaction) => {
    try {
      const matchedCat = categoriesList.find(
        (c) => c.name.toLowerCase() === transaction.category.toLowerCase()
      );
      const payload: UpdateTransactionPayload = {
        type: (transaction.type.toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE') as 'INCOME' | 'EXPENSE',
        amount: transaction.amount,
        categoryId: matchedCat?.id || transaction.categoryId || null,
        description: transaction.merchant,
        date: transaction.date,
      };
      const updated = await ApiService.updateTransaction(transaction.id, payload);
      setTransactions((current) =>
        current.map((item) => (item.id === transaction.id ? updated : item))
      );
      setEditingTransaction(null);
      setToast('Transaction updated successfully');
    } catch (err: any) {
      console.error('Failed to update transaction:', err);
      setToast(`Failed to update transaction: ${err?.message || 'Unknown error'}`);
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await ApiService.deleteTransaction(id);
      setTransactions((current) => current.filter((item) => item.id !== id));
      setToast('Transaction removed');
    } catch (err: any) {
      console.error('Failed to delete transaction:', err);
      setToast(`Failed to remove transaction: ${err?.message || 'Unknown error'}`);
    }
  };

  const addBudget = async (budget: Budget) => {
    try {
      const matchedCat = categoriesList.find(
        (c) => c.name.toLowerCase() === budget.category.toLowerCase()
      );
      const created = await ApiService.createBudget({
        categoryId: matchedCat?.id || budget.categoryId || null,
        amount: budget.limit,
        period: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0],
      });
      const newBudgetItem: Budget = {
        id: created.budget?.id || created.id || budget.id,
        category: created.budget?.category?.name || budget.category,
        categoryId: created.budget?.categoryId || matchedCat?.id,
        limit: Number(created.budget?.amount ?? budget.limit),
      };
      setBudgets((current) => [...current, newBudgetItem]);
      setModal(null);
      setToast('Budget created');
    } catch (err: any) {
      console.error('Failed to create budget:', err);
      setToast(`Failed to create budget: ${err?.message || 'Unknown error'}`);
      throw err;
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await ApiService.deleteBudget(id);
      setBudgets((current) => current.filter((item) => item.id !== id));
      setToast('Budget removed');
    } catch (err: any) {
      console.error('Failed to delete budget:', err);
      setToast(`Failed to delete budget: ${err?.message || 'Unknown error'}`);
    }
  };

  const addGoal = async (goal: Goal) => {
    try {
      const created = await ApiService.createGoal({
        name: goal.name,
        targetAmount: goal.target,
        currentAmount: goal.saved,
        targetDate: goal.date || null,
      });
      const newGoalItem: Goal = {
        id: created.goal?.id || created.id || goal.id,
        name: created.goal?.name || goal.name,
        target: Number(created.goal?.targetAmount ?? goal.target),
        saved: Number(created.goal?.currentAmount ?? goal.saved),
        date: created.goal?.targetDate ? created.goal.targetDate.split('T')[0] : goal.date,
        color: goal.color,
      };
      setGoals((current) => [...current, newGoalItem]);
      setModal(null);
      setToast('Savings goal created');
    } catch (err: any) {
      console.error('Failed to create goal:', err);
      setToast(`Failed to create goal: ${err?.message || 'Unknown error'}`);
      throw err;
    }
  };

  const contribute = async (id: string) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    const newSaved = Math.min(goal.target, goal.saved + 250);
    try {
      await ApiService.updateGoal(id, { currentAmount: newSaved });
      setGoals((current) =>
        current.map((g) => (g.id === id ? { ...g, saved: newSaved } : g))
      );
      setToast('Contribution added');
    } catch (err: any) {
      console.error('Failed to contribute to goal:', err);
      setToast(`Failed to contribute: ${err?.message || 'Unknown error'}`);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await ApiService.deleteGoal(id);
      setGoals((current) => current.filter((g) => g.id !== id));
      setToast('Goal removed');
    } catch (err: any) {
      console.error('Failed to delete goal:', err);
      setToast(`Failed to delete goal: ${err?.message || 'Unknown error'}`);
    }
  };

  const importTransactions = async (incoming: Transaction[]) => {
    try {
      let count = 0;
      for (const item of incoming) {
        try {
          const matchedCat = categoriesList.find(
            (c) => c.name.toLowerCase() === item.category.toLowerCase()
          );
          await ApiService.createTransaction({
            type: (item.type.toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE') as 'INCOME' | 'EXPENSE',
            amount: item.amount,
            categoryId: matchedCat?.id || null,
            description: item.merchant,
            date: item.date,
          });
          count++;
        } catch (e) {
          console.warn('Failed to import transaction row:', item, e);
        }
      }
      await loadUserData();
      setModal(null);
      setToast(`${count} transactions imported successfully`);
    } catch (err: any) {
      console.error('Failed to import CSV:', err);
      setToast(`Import failed: ${err?.message || 'Unknown error'}`);
    }
  };

  // While restoring session, show a minimal full-screen spinner
  if (loading) {
    return (
      <div className="auth-loading" role="status" aria-label="Loading">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  // Not authenticated — show the login/register screen
  if (!user) {
    return (
      <div className="auth-wrapper">
        <AuthScreen />
      </div>
    );
  }

  const displayName = user.name || 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        navigate={navigate}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        transactionCount={transactions.length}
        onLogout={logout}
      />
      <div className="main-shell">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <Menu size={21} />
          </button>
          <div className="crumbs">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{pageTitle(page)}</strong>
          </div>
          <div className="top-actions">
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotifications(0)}>
              <Bell size={19} />
              {notifications > 0 && <span className="notification-dot">{notifications}</span>}
            </button>
            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
            <div className="profile-chip">
              <span className="avatar">{initials}</span>
              <span className="profile-name">{displayName}</span>
              <ChevronDown size={15} />
            </div>
            <button className="button button-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }} onClick={() => logout()} aria-label="Log out">Log out</button>
          </div>
        </header>
        <main className="page-content">
          {page === 'dashboard' && <Dashboard transactions={transactions} budgets={budgets} navigate={navigate} onAdd={() => setModal('transaction')} />}
          {page === 'transactions' && (
            <Transactions
              transactions={transactions}
              categoriesList={categoriesList}
              loading={loadingTransactions}
              error={transactionError}
              onRefresh={loadUserData}
              onAdd={() => setModal('transaction')}
              onUpload={() => setModal('upload')}
              onEdit={setEditingTransaction}
              onDelete={deleteTransaction}
            />
          )}
          {page === 'analytics' && <Analytics transactions={transactions} />}
          {page === 'budgets' && (
            <Budgets
              transactions={transactions}
              budgets={budgets}
              onAdd={() => setModal('budget')}
              onDelete={deleteBudget}
            />
          )}
          {page === 'savings' && (
            <Savings
              goals={goals}
              onAdd={() => setModal('goal')}
              onContribute={contribute}
              onDelete={deleteGoal}
            />
          )}
          {page === 'assistant' && <Assistant transactions={transactions} budgets={budgets} goals={goals} />}
          {page === 'settings' && <SettingsPanel theme={theme} setTheme={setTheme} syncData={syncData} exportData={exportData} setToast={setToast} />}
        </main>
      </div>
      {modal === 'transaction' && (
        <TransactionModal
          categoriesList={categoriesList}
          onClose={() => setModal(null)}
          onSave={addTransaction}
        />
      )}
      {modal === 'budget' && (
        <BudgetModal
          categoriesList={categoriesList}
          onClose={() => setModal(null)}
          onSave={addBudget}
        />
      )}
      {modal === 'goal' && (
        <GoalModal
          onClose={() => setModal(null)}
          onSave={addGoal}
        />
      )}
      {modal === 'upload' && <UploadModal onClose={() => setModal(null)} onImport={importTransactions} />}
      {editingTransaction && (
        <TransactionModal
          initial={editingTransaction}
          categoriesList={categoriesList}
          onClose={() => setEditingTransaction(null)}
          onSave={saveTransaction}
        />
      )}
      {toast && (
        <div className="toast">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}

function pageTitle(page: Page) {
  return {
    dashboard: 'Overview',
    transactions: 'Transactions',
    analytics: 'Analytics',
    budgets: 'Budgets',
    savings: 'Savings goals',
    assistant: 'AI assistant',
    settings: 'Settings',
  }[page];
}

function SidebarUser({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  const displayName = user?.name || 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="sidebar-user" style={{ cursor: 'pointer' }} onClick={onLogout} title="Click to log out">
      <span className="avatar">{initials}</span>
      <div><strong>{displayName}</strong><span>Free workspace</span></div>
      <MoreHorizontal size={17} />
    </div>
  );
}

function Sidebar({
  page,
  navigate,
  mobileOpen,
  onClose,
  transactionCount,
  onLogout,
}: {
  page: Page;
  navigate: (page: Page) => void;
  mobileOpen: boolean;
  onClose: () => void;
  transactionCount: number;
  onLogout: () => void;
}) {
  const mainNav: { id: Page; label: string; icon: IconType }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'budgets', label: 'Budgets', icon: Wallet },
    { id: 'savings', label: 'Savings goals', icon: Target },
  ];

  return (
    <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
      <div className="brand">
        <span className="brand-mark">
          <Zap size={20} fill="currentColor" />
        </span>
        <span>
          spendwise<span className="brand-ai">AI</span>
        </span>
      </div>
      <div className="workspace-select">
        <span className="workspace-icon">
          <BriefcaseBusiness size={15} />
        </span>
        <span>
          <small>Workspace</small>
          <strong>Personal finances</strong>
        </span>
        <ChevronDown size={15} />
      </div>
      <nav aria-label="Main navigation">
        <p className="nav-label">Workspace</p>
        {mainNav.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}>
              <Icon size={18} />
              <span>{item.label}</span>
              {item.id === 'transactions' && <span className="nav-count">{transactionCount}</span>}
            </button>
          );
        })}
        <button className={`nav-item ${page === 'assistant' ? 'active' : ''}`} onClick={() => navigate('assistant')}>
          <Bot size={18} />
          <span>AI assistant</span>
          <span className="new-pill">NEW</span>
        </button>
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-tip">
          <Sparkles size={17} />
          <div>
            <strong>Smarter with AI</strong>
            <span>Get a clearer view of your money.</span>
          </div>
        </div>
        <button className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => navigate('settings')}>
          <Settings size={18} />
          <span>Settings</span>
        </button>
        <SidebarUser onLogout={onLogout} />
      </div>
      {mobileOpen && (
        <button className="sidebar-close" aria-label="Close navigation" onClick={onClose}>
          <X size={20} />
        </button>
      )}
    </aside>
  );
}


function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow || 'Personal finances'}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="header-action">{action}</div>}
    </div>
  );
}

function Button({
  children,
  variant = 'primary',
  onClick,
  icon,
  type = 'button',
  disabled = false,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void;
  icon?: ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button type={type} className={`button button-${variant}`} onClick={onClick} disabled={disabled}>
      {icon}
      {children}
    </button>
  );
}

function StatCard({ label, value, change, positive = true, icon }: { label: string; value: string; change?: string; positive?: boolean; icon: ReactNode }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      {change && (
        <div className={`stat-change ${positive ? 'positive' : 'negative'}`}>
          {positive ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
          {change}
          <span className="change-muted">vs last month</span>
        </div>
      )}
    </div>
  );
}

function Dashboard({
  transactions,
  budgets,
  navigate,
  onAdd,
}: {
  transactions: Transaction[];
  budgets: Budget[];
  navigate: (page: Page) => void;
  onAdd: () => void;
}) {
  const { user } = useAuth();
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const savings = income - expense;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
  const score = clamp(63 + Math.round(savingsRate / 2), 0, 100);

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
  }, []);

  return (
    <>
      <PageHeader
        eyebrow={todayFormatted}
        title={`Good morning, ${user?.name?.split(' ')[0] || 'User'}`}
        description="Here’s your financial snapshot for the last 6 months."
        action={
          <div className="header-actions">
            <Button variant="secondary" onClick={() => navigate('transactions')} icon={<Upload size={16} />}>
              Import data
            </Button>
            <Button onClick={onAdd} icon={<Plus size={17} />}>
              Add transaction
            </Button>
          </div>
        }
      />
      <section className="stats-grid">
        <StatCard label="Total balance" value={money(savings)} icon={<Wallet size={18} />} />
        <StatCard label="Total income" value={money(income)} icon={<ArrowDownRight size={18} />} />
        <StatCard label="Total expenses" value={money(expense)} positive={false} icon={<ArrowUpRight size={18} />} />
        <StatCard label="Savings rate" value={`${savingsRate}%`} icon={<Target size={18} />} />
      </section>
      <div className="dashboard-grid">
        <div className="card chart-card trend-card">
          <CardHeading
            title="Spending overview"
            subtitle="Income and expenses over time"
            action={<button className="select-button" onClick={() => navigate('analytics')}>Last 6 months <ChevronDown size={14} /></button>}
          />
          <OverviewChart transactions={transactions} />
        </div>
        <HealthCard score={score} savingsRate={savingsRate} />
      </div>
      <div className="dashboard-grid lower-grid">
        <div className="card">
          <CardHeading
            title="Recent transactions"
            subtitle="Your latest activity"
            action={
              <Button variant="ghost" onClick={() => navigate('transactions')}>
                View all <ChevronRight size={15} />
              </Button>
            }
          />
          <TransactionList transactions={transactions.slice(0, 6)} />
        </div>
        <div className="card">
          <CardHeading
            title="Budget overview"
            subtitle="Current period"
            action={
              <Button variant="ghost" onClick={() => navigate('budgets')}>
                Manage <ChevronRight size={15} />
              </Button>
            }
          />
          <BudgetMini transactions={transactions} budgets={budgets} />
        </div>
      </div>
      <div className="insight-row">
        <div className="insight-card ai-insight">
          <div className="insight-icon">
            <Sparkles size={19} />
          </div>
          <div>
            <span className="eyebrow">Spendwise insight</span>
            <h3>Your savings rate is trending up</h3>
            <p>
              You’re saving {savingsRate}% of your income across the period. That’s {Math.max(1, Math.round(savingsRate / 4))}% higher than your previous average.
            </p>
          </div>
          <button onClick={() => navigate('assistant')} aria-label="Open AI assistant">
            <ChevronRight size={19} />
          </button>
        </div>
        <div className="insight-card warning-insight">
          <div className="insight-icon">
            <Lightbulb size={19} />
          </div>
          <div>
            <span className="eyebrow">Worth a look</span>
            <h3>Dining is your fastest-growing category</h3>
            <p>Spending is up 18% compared with May. Small changes add up quickly.</p>
          </div>
          <button onClick={() => navigate('analytics')} aria-label="Open analytics">
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
      <div className="quick-actions">
        <span className="eyebrow">Quick actions</span>
        <button onClick={onAdd}>
          <Plus size={16} />
          Add transaction
        </button>
        <button onClick={() => navigate('analytics')}>
          <BarChart3 size={16} />
          View analytics
        </button>
        <button onClick={() => navigate('savings')}>
          <Target size={16} />
          Add savings goal
        </button>
        <button onClick={() => navigate('assistant')}>
          <Bot size={16} />
          Ask Spendwise
        </button>
      </div>
      <div className="sr-only" aria-live="polite">
        Dashboard showing {transactions.length} transactions, {money(expense)} in expenses, and a financial health score of {score}.
      </div>
    </>
  );
}

function CardHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="card-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function OverviewChart({ transactions }: { transactions: Transaction[] }) {
  const months = useMemo(() => {
    const monthSet = new Set(transactions.map(t => t.date.slice(0, 7)).filter(Boolean));
    if (monthSet.size === 0) {
      return ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
    }
    const sorted = Array.from(monthSet).sort();
    return sorted.slice(-6);
  }, [transactions]);

  const values = useMemo(() => {
    return months.map(month => {
      const rows = transactions.filter(t => t.date.startsWith(month));
      return {
        month,
        income: rows.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: rows.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [months, transactions]);

  const max = Math.max(...values.map(item => Math.max(item.income, item.expense)), 1);
  const width = 680;
  const height = 220;

  const points = (key: 'income' | 'expense') =>
    values
      .map((item, index) => {
        const x = values.length > 1 ? (index * width) / (values.length - 1) : width / 2;
        const y = height - (item[key] / max) * 185 - 10;
        return `${x},${y}`;
      })
      .join(' ');

  const latestVal = values[values.length - 1] || { month: '2026-06', income: 0, expense: 0 };

  return (
    <div className="chart-wrap">
      <div className="legend">
        <span>
          <i className="legend-dot income-dot" />
          Income
        </span>
        <span>
          <i className="legend-dot expense-dot" />
          Expenses
        </span>
        <strong>
          {monthLabel(latestVal.month)}: {money(latestVal.income - latestVal.expense)} saved
        </strong>
      </div>
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Income and expenses line chart">
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#22a06b" stopOpacity=".2" />
            <stop offset="1" stopColor="#22a06b" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map(line => (
          <line key={line} x1="0" x2={width} y1={line * 65 + 5} y2={line * 65 + 5} className="grid-line" />
        ))}
        {values.length > 1 && (
          <polygon points={`0,${height} ${points('income')} ${width},${height}`} fill="url(#area)" />
        )}
        <polyline points={points('income')} className="chart-line income-line" />
        <polyline points={points('expense')} className="chart-line expense-line" />
        {values.map((item, index) => {
          const cx = values.length > 1 ? (index * width) / (values.length - 1) : width / 2;
          return (
            <g key={item.month}>
              <circle cx={cx} cy={height - (item.income / max) * 185 - 10} r="4" className="chart-point income-point" />
              <circle cx={cx} cy={height - (item.expense / max) * 185 - 10} r="4" className="chart-point expense-point" />
            </g>
          );
        })}
      </svg>
      <div className="x-labels">
        {values.map(item => (
          <span key={item.month}>{monthLabel(item.month)}</span>
        ))}
      </div>
    </div>
  );
}

function HealthCard({ score, savingsRate }: { score: number; savingsRate: number }) {
  const circumference = 2 * Math.PI * 72;
  return (
    <div className="card health-card">
      <CardHeading title="Financial health" subtitle="Based on your recent activity" action={<button className="info-button" aria-label="How the score works">i</button>} />
      <div className="gauge">
        <svg viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="72" className="gauge-track" />
          <circle
            cx="90"
            cy="90"
            r="72"
            className="gauge-progress"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * score) / 100}
          />
        </svg>
        <div className="gauge-number">
          <strong>{score}</strong>
          <span>/ 100</span>
          <small>{score >= 80 ? 'Excellent' : score >= 65 ? 'Good standing' : 'Needs attention'}</small>
        </div>
      </div>
      <div className="health-meter">
        <span>Needs focus</span>
        <div>
          <i style={{ width: `${score}%` }} />
        </div>
        <span>Excellent</span>
      </div>
      <p className="health-copy">
        Your consistent income and {savingsRate}% savings rate are building a strong financial foundation.
      </p>
      <div className="health-factors">
        <span>
          <Check size={14} />
          Savings rate
        </span>
        <span>
          <Check size={14} />
          Income consistency
        </span>
        <span>
          <Check size={14} />
          Budget adherence
        </span>
      </div>
    </div>
  );
}

function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="transaction-list">
      {transactions.map(transaction => (
        <div className="transaction-row" key={transaction.id}>
          <span
            className="merchant-icon"
            style={{
              background: `${categoryColors[transaction.category] || '#64748b'}18`,
              color: categoryColors[transaction.category] || '#64748b',
            }}
          >
            {transaction.type === 'income' ? <ArrowDownRight size={17} /> : <CreditCard size={17} />}
          </span>
          <div className="transaction-main">
            <strong>{transaction.merchant}</strong>
            <span>
              {transaction.category} · {dateLabel(transaction.date)}
            </span>
          </div>
          <strong className={transaction.type === 'income' ? 'amount-income' : ''}>
            {transaction.type === 'income' ? '+' : '-'}
            {preciseMoney(transaction.amount)}
          </strong>
        </div>
      ))}
      {transactions.length === 0 && (
        <EmptyState icon={<Receipt size={24} />} title="No transactions yet" description="Add or import transactions to get started." />
      )}
    </div>
  );
}

function BudgetMini({ transactions, budgets }: { transactions: Transaction[]; budgets: Budget[] }) {
  const currentMonthPrefix = useMemo(() => {
    const dates = transactions.map(t => t.date.slice(0, 7)).filter(Boolean).sort();
    return dates[dates.length - 1] || '2026-06';
  }, [transactions]);

  return (
    <div className="budget-mini">
      {budgets.slice(0, 4).map(budget => {
        const spent = transactions
          .filter(t => t.type === 'expense' && t.category === budget.category && t.date.startsWith(currentMonthPrefix))
          .reduce((s, t) => s + t.amount, 0);
        const percent = budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;
        return (
          <div className="budget-mini-row" key={budget.id}>
            <div>
              <span className="category-dot" style={{ background: categoryColors[budget.category] || '#64748b' }} />
              <strong>{budget.category}</strong>
              <span>
                {money(spent)} / {money(budget.limit)}
              </span>
            </div>
            <div className="progress-track">
              <i
                className={percent > 90 ? 'over' : ''}
                style={{ width: `${clamp(percent, 0, 100)}%`, background: categoryColors[budget.category] || '#64748b' }}
              />
            </div>
            <b>{percent}%</b>
          </div>
        );
      })}
      {budgets.length === 0 && (
        <EmptyState icon={<Wallet size={20} />} title="No budgets set" description="Create a category budget to track spending limits." />
      )}
    </div>
  );
}

function Transactions({
  transactions,
  categoriesList = [],
  loading = false,
  error = null,
  onRefresh,
  onAdd,
  onUpload,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  categoriesList?: ApiCategory[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onAdd: () => void;
  onUpload: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [type, setType] = useState('All');
  const [sortAsc, setSortAsc] = useState(false);

  // Dynamic categories filter list
  const categoryOptions = useMemo(() => {
    const set = new Set<string>(['All']);
    categoriesList.forEach((c) => set.add(c.name));
    categories.forEach((c) => set.add(c));
    return Array.from(set);
  }, [categoriesList]);

  const filtered = useMemo(
    () =>
      transactions
        .filter((t) => `${t.merchant} ${t.category}`.toLowerCase().includes(query.toLowerCase()))
        .filter((t) => category === 'All' || t.category === category)
        .filter((t) => type === 'All' || t.type === type)
        .sort((a, b) => (sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date))),
    [transactions, query, category, type, sortAsc]
  );

  return (
    <>
      <PageHeader
        eyebrow="Activity"
        title="Transactions"
        description="Review, categorize, and stay close to every dollar in your authentic records."
        action={
          <div className="header-actions">
            {onRefresh && (
              <Button variant="secondary" onClick={onRefresh} icon={<RefreshCw size={15} />} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            )}
            <Button variant="secondary" onClick={onUpload} icon={<CloudUpload size={16} />}>
              Import CSV
            </Button>
            <Button onClick={onAdd} icon={<Plus size={17} />}>
              Add transaction
            </Button>
          </div>
        }
      />

      {error && (
        <div className="form-error" style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>⚠️ {error}</span>
          {onRefresh && (
            <button className="retry-link" onClick={onRefresh} style={{ marginLeft: '10px' }}>
              Retry
            </button>
          )}
        </div>
      )}

      <div className="card table-card">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search transactions..."
              aria-label="Search transactions"
            />
          </div>
          <div className="filter-group">
            <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
              {categoryOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter by transaction type">
              <option value="All">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
            <button className="icon-button" aria-label="Change sort order" onClick={() => setSortAsc((current) => !current)}>
              <ListFilter size={17} />
            </button>
          </div>
        </div>
        <div className="table-summary">
          <span>
            {loading ? 'Loading transactions...' : <>Showing <strong>{filtered.length}</strong> transactions</>}
          </span>
          <span>
            <Filter size={14} /> Filters update instantly
          </span>
        </div>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Category</th>
                <th>Date</th>
                <th>Account</th>
                <th className="align-right">Amount</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <div className="table-merchant">
                      <span
                        className="merchant-icon"
                        style={{
                          background: `${categoryColors[transaction.category] || '#64748b'}18`,
                          color: categoryColors[transaction.category] || '#64748b',
                        }}
                      >
                        {transaction.type === 'income' ? <ArrowDownRight size={16} /> : <CreditCard size={16} />}
                      </span>
                      <strong>{transaction.merchant}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="category-tag">
                      <i style={{ background: categoryColors[transaction.category] || '#64748b' }} />
                      {transaction.category}
                    </span>
                  </td>
                  <td>{dateLabel(transaction.date)}</td>
                  <td className="muted-cell">{transaction.account}</td>
                  <td className={`align-right amount-cell ${transaction.type === 'income' ? 'amount-income' : ''}`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {preciseMoney(transaction.amount)}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button aria-label={`Edit ${transaction.merchant}`} onClick={() => onEdit(transaction)}>
                        <Pencil size={15} />
                      </button>
                      <button aria-label={`Delete ${transaction.merchant}`} onClick={() => onDelete(transaction.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <div style={{ padding: '35px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              <div className="auth-loading-spinner" style={{ margin: '0 auto 12px', width: '28px', height: '28px' }} />
              Loading verified transactions...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <EmptyState
              icon={<Search size={24} />}
              title="No transactions found"
              description={
                transactions.length === 0
                  ? "You haven't added any transactions yet. Click 'Add transaction' or 'Import CSV' above to record your first transaction!"
                  : 'Try a different search query or reset your filters.'
              }
            />
          )}
        </div>
      </div>
    </>
  );
}

function Analytics({ transactions }: { transactions: Transaction[] }) {
  const [range, setRange] = useState('Last 6 months');

  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];
    const sortedDates = [...transactions].map(t => t.date).sort();
    const latestDateStr = sortedDates[sortedDates.length - 1] || '2026-06-30';
    const latestDate = parseDateSafe(latestDateStr);

    return transactions.filter(t => {
      const tDate = parseDateSafe(t.date);
      if (isNaN(tDate.getTime())) return true;

      if (range === 'This month') {
        return t.date.slice(0, 7) === latestDateStr.slice(0, 7);
      }
      if (range === 'Last month') {
        const lastMonthDate = new Date(latestDate.getFullYear(), latestDate.getMonth() - 1, 1);
        const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
        return t.date.slice(0, 7) === lastMonthStr;
      }
      if (range === 'Last 3 months') {
        const threeMonthsAgo = new Date(latestDate.getFullYear(), latestDate.getMonth() - 2, 1);
        return tDate >= threeMonthsAgo && tDate <= latestDate;
      }
      if (range === 'Last 6 months') {
        const sixMonthsAgo = new Date(latestDate.getFullYear(), latestDate.getMonth() - 5, 1);
        return tDate >= sixMonthsAgo && tDate <= latestDate;
      }
      if (range === 'This year') {
        return t.date.startsWith(String(latestDate.getFullYear()));
      }
      return true;
    });
  }, [transactions, range]);

  const expenses = filteredTransactions.filter(t => t.type === 'expense');
  const byCategory = useMemo(() => {
    return categories
      .slice(1)
      .map(category => ({
        category,
        value: expenses.filter(t => t.category === category).reduce((s, t) => s + t.amount, 0),
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const total = byCategory.reduce((s, item) => s + item.value, 0);
  const max = Math.max(...byCategory.map(item => item.value), 1);
  const top = byCategory[0];

  return (
    <>
      <PageHeader
        eyebrow="Your money, in context"
        title="Analytics"
        description="Understand your patterns and make more intentional decisions."
        action={
          <select className="range-select" value={range} onChange={event => setRange(event.target.value)} aria-label="Select date range">
            <option>This month</option>
            <option>Last month</option>
            <option>Last 3 months</option>
            <option>Last 6 months</option>
            <option>This year</option>
          </select>
        }
      />
      <div className="analytics-summary">
        <div>
          <span className="eyebrow">Total spending</span>
          <strong>{money(total)}</strong>
          <span className="positive-text">
            <ArrowUpRight size={15} /> 2.1% lower than previous period
          </span>
        </div>
        <div>
          <span className="eyebrow">Top category</span>
          <strong>{top?.category || '—'}</strong>
          <span>{top && total > 0 ? `${money(top.value)} · ${Math.round((top.value / total) * 100)}% of spending` : 'No data yet'}</span>
        </div>
        <div>
          <span className="eyebrow">Transactions analyzed</span>
          <strong>{filteredTransactions.length}</strong>
          <span>Across connected accounts</span>
        </div>
      </div>
      <div className="analytics-grid">
        <div className="card chart-card">
          <CardHeading title="Monthly comparison" subtitle={`Income versus expenses · ${range}`} />
          <MonthlyBars transactions={filteredTransactions.length ? filteredTransactions : transactions} />
        </div>
        <div className="card chart-card">
          <CardHeading title="Where your money goes" subtitle="All categories" />
          <DonutChart data={byCategory} total={total} />
        </div>
      </div>
      <div className="analytics-grid bottom-analytics">
        <div className="card">
          <CardHeading title="Top spending categories" subtitle="Ranked by total spend" />
          <div className="category-bars">
            {byCategory.slice(0, 6).map(item => (
              <div className="category-bar" key={item.category}>
                <div>
                  <span>
                    <i style={{ background: categoryColors[item.category] || '#64748b' }} />
                    {item.category}
                  </span>
                  <strong>{money(item.value)}</strong>
                </div>
                <div className="wide-track">
                  <i style={{ width: `${(item.value / max) * 100}%`, background: categoryColors[item.category] || '#64748b' }} />
                </div>
              </div>
            ))}
            {byCategory.length === 0 && (
              <EmptyState icon={<BarChart3 size={20} />} title="No spending data" description="No expenses recorded for this period." />
            )}
          </div>
        </div>
        <div className="card">
          <CardHeading title="Your takeaways" subtitle="Generated from your activity" />
          <div className="takeaways">
            <div>
              <span className="takeaway-icon green">
                <TrendingUp size={17} />
              </span>
              <p>
                <strong>{top?.category || 'Your spending'}</strong> is your largest category this period.
              </p>
            </div>
            <div>
              <span className="takeaway-icon purple">
                <Sparkles size={17} />
              </span>
              <p>
                Your savings pattern is <strong>moving in the right direction</strong>.
              </p>
            </div>
            <div>
              <span className="takeaway-icon orange">
                <Lightbulb size={17} />
              </span>
              <p>Review recurring subscriptions to find easy wins.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MonthlyBars({ transactions }: { transactions: Transaction[] }) {
  const months = useMemo(() => {
    const monthSet = new Set(transactions.map(t => t.date.slice(0, 7)).filter(Boolean));
    if (monthSet.size === 0) {
      return ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
    }
    const sorted = Array.from(monthSet).sort();
    return sorted.slice(-6);
  }, [transactions]);

  const values = useMemo(() => {
    return months.map(month => ({
      month,
      income: transactions.filter(t => t.date.startsWith(month) && t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: transactions.filter(t => t.date.startsWith(month) && t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }));
  }, [months, transactions]);

  const max = Math.max(...values.map(item => item.income), ...values.map(item => item.expense), 1);

  return (
    <div className="bar-chart">
      <div className="bar-legend">
        <span>
          <i className="legend-dot income-dot" />
          Income
        </span>
        <span>
          <i className="legend-dot expense-dot" />
          Expenses
        </span>
      </div>
      <div className="bars">
        {values.map(item => (
          <div className="bar-column" key={item.month}>
            <div className="bar-pair">
              <i className="bar income-bar" style={{ height: `${(item.income / max) * 170}px` }} />
              <i className="bar expense-bar" style={{ height: `${(item.expense / max) * 170}px` }} />
            </div>
            <span>{monthLabel(item.month)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ data, total }: { data: { category: string; value: number }[]; total: number }) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let runningOffset = 0;

  return (
    <div className="donut-wrap">
      <div className="donut-visual">
        <svg viewBox="0 0 180 180">
          <circle cx="90" cy="90" r={radius} className="donut-track" />
          {data.map(item => {
            const length = total > 0 ? (item.value / total) * circumference : 0;
            const element = (
              <circle
                key={item.category}
                cx="90"
                cy="90"
                r={radius}
                className="donut-segment"
                stroke={categoryColors[item.category] || '#64748b'}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-runningOffset}
              />
            );
            runningOffset += length;
            return element;
          })}
        </svg>
        <div>
          <strong>{money(total)}</strong>
          <span>Total spend</span>
        </div>
      </div>
      <div className="donut-legend">
        {data.slice(0, 5).map(item => (
          <div key={item.category}>
            <span>
              <i style={{ background: categoryColors[item.category] || '#64748b' }} />
              {item.category}
            </span>
            <strong>{total > 0 ? Math.round((item.value / total) * 100) : 0}%</strong>
          </div>
        ))}
        {data.length === 0 && <span style={{ color: 'var(--muted)', fontSize: '11px' }}>No categories to display</span>}
      </div>
    </div>
  );
}

function Budgets({
  transactions,
  budgets,
  onAdd,
  onDelete,
}: {
  transactions: Transaction[];
  budgets: Budget[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const currentMonthStr = useMemo(() => {
    const dates = transactions.map(t => t.date.slice(0, 7)).filter(Boolean).sort();
    return dates[dates.length - 1] || '2026-06';
  }, [transactions]);

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, budget) => {
    const spent = transactions
      .filter(t => t.category === budget.category && t.type === 'expense' && t.date.startsWith(currentMonthStr))
      .reduce((s, t) => s + t.amount, 0);
    return sum + spent;
  }, 0);

  const remaining = Math.max(0, totalBudget - totalSpent);
  const usedPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Plan with intention"
        title="Budgets"
        description="Give every dollar a job, without making your life complicated."
        action={
          <Button onClick={onAdd} icon={<Plus size={17} />}>
            Create budget
          </Button>
        }
      />
      <div className="budget-banner">
        <div className="banner-icon">
          <Gauge size={21} />
        </div>
        <div>
          <strong>{monthLabel(currentMonthStr)} budget health</strong>
          <span>
            {money(remaining)} remaining across {budgets.length} categories
          </span>
        </div>
        <div className="banner-progress">
          <div>
            <i style={{ width: `${clamp(usedPercent, 0, 100)}%` }} />
          </div>
          <b>{usedPercent}% used</b>
        </div>
      </div>
      <div className="budget-grid">
        {budgets.map(budget => {
          const spent = transactions
            .filter(t => t.category === budget.category && t.type === 'expense' && t.date.startsWith(currentMonthStr))
            .reduce((s, t) => s + t.amount, 0);
          const percent = budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;
          const status = percent > 100 ? 'Over budget' : percent > 80 ? 'Approaching limit' : 'On track';

          return (
            <div className="card budget-card" key={budget.id}>
              <div className="budget-card-top">
                <span
                  className="category-icon"
                  style={{
                    color: categoryColors[budget.category] || '#64748b',
                    background: `${categoryColors[budget.category] || '#64748b'}18`,
                  }}
                >
                  <CircleDollarSign size={18} />
                </span>
                <button
                  className="icon-button subtle"
                  aria-label={`Delete ${budget.category} budget`}
                  title="Delete budget"
                  onClick={() => onDelete(budget.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <span className="eyebrow">{budget.category}</span>
              <div className="budget-amount">
                <strong>{money(spent)}</strong>
                <span>of {money(budget.limit)}</span>
              </div>
              <div className="wide-track budget-progress">
                <i
                  className={percent > 100 ? 'over' : ''}
                  style={{
                    width: `${clamp(percent, 0, 100)}%`,
                    background: categoryColors[budget.category] || '#64748b',
                  }}
                />
              </div>
              <div className="budget-foot">
                <span className={percent > 80 ? 'warning-text' : 'positive-text'}>{status}</span>
                <strong>{percent}%</strong>
              </div>
            </div>
          );
        })}
        <button className="add-card" onClick={onAdd}>
          <Plus size={20} />
          <strong>Add a category budget</strong>
          <span>Keep your plan flexible</span>
        </button>
      </div>
    </>
  );
}

function Savings({
  goals,
  onAdd,
  onContribute,
  onDelete,
}: {
  goals: Goal[];
  onAdd: () => void;
  onContribute: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const totalSaved = goals.reduce((sum, goal) => sum + goal.saved, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
  const totalPercent = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const remaining = Math.max(0, totalTarget - totalSaved);

  return (
    <>
      <PageHeader
        eyebrow="Build what matters"
        title="Savings goals"
        description="Small, consistent progress toward the life you’re planning."
        action={
          <Button onClick={onAdd} icon={<Plus size={17} />}>
            New goal
          </Button>
        }
      />
      <div className="savings-overview">
        <div>
          <span className="eyebrow">Across all goals</span>
          <strong>{money(totalSaved)}</strong>
          <span className="positive-text">
            <TrendingUp size={15} /> {totalPercent}% of your total target
          </span>
        </div>
        <div className="savings-total-progress">
          <div>
            <i style={{ width: `${clamp(totalPercent, 0, 100)}%` }} />
          </div>
          <span>{money(remaining)} to go</span>
        </div>
        <Target size={52} className="overview-target" />
      </div>
      <div className="goal-grid">
        {goals.map(goal => {
          const percent = goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0;
          return (
            <div className="card goal-card" key={goal.id}>
              <div className="goal-top">
                <span className="goal-symbol" style={{ color: goal.color, background: `${goal.color}18` }}>
                  <Target size={19} />
                </span>
                <button
                  className="icon-button subtle"
                  aria-label={`Delete ${goal.name}`}
                  title="Delete goal"
                  onClick={() => onDelete(goal.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <span className="eyebrow">Target · {dateLabel(goal.date)}</span>
              <h2>{goal.name}</h2>
              <div className="goal-amount">
                <strong>{money(goal.saved)}</strong>
                <span>of {money(goal.target)}</span>
              </div>
              <div className="wide-track">
                <i style={{ width: `${clamp(percent, 0, 100)}%`, background: goal.color }} />
              </div>
              <div className="goal-foot">
                <strong>{percent}% complete</strong>
                <Button variant="secondary" onClick={() => onContribute(goal.id)} icon={<Plus size={15} />}>
                  Contribute
                </Button>
              </div>
            </div>
          );
        })}
        <button className="add-card" onClick={onAdd}>
          <Plus size={20} />
          <strong>Start a new goal</strong>
          <span>Make your next milestone tangible</span>
        </button>
      </div>
      <div className="responsible-note">
        <ShieldCheck size={18} />
        <span>
          <strong>A responsible approach</strong> Savings targets are guideposts, not guarantees. Adjust them whenever life changes.
        </span>
      </div>
    </>
  );
}

interface MessageItem {
  id: string;
  from: 'ai' | 'user';
  text: string;
  error?: boolean;
  provider?: string;
  timestamp: string;
}

function renderInlineFormatted(str: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      parts.push(str.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={`b-${match.index}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={`i-${match.index}`}>{token.slice(1, -1)}</em>);
    }
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < str.length) {
    parts.push(str.substring(lastIdx));
  }
  return parts.length > 0 ? parts : str;
}

function FormattedMessageText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="message-content">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lIdx} style={{ height: '5px' }} />;
        }

        // Bullet point
        if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={lIdx} className="message-bullet-item" style={{ display: 'flex', gap: '6px', margin: '2px 0' }}>
              <span style={{ opacity: 0.6 }}>•</span>
              <div>{renderInlineFormatted(content)}</div>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={lIdx} className="message-num-item" style={{ display: 'flex', gap: '6px', margin: '2px 0' }}>
              <span style={{ fontWeight: 600, opacity: 0.8 }}>{numMatch[1]}.</span>
              <div>{renderInlineFormatted(numMatch[2])}</div>
            </div>
          );
        }

        return <div key={lIdx} style={{ margin: '2px 0' }}>{renderInlineFormatted(trimmed)}</div>;
      })}
    </div>
  );
}

function Assistant({
  transactions: _transactions,
  budgets: _budgets,
  goals: _goals,
}: {
  transactions?: Transaction[];
  budgets?: Budget[];
  goals?: Goal[];
}) {
  const { user } = useAuth();
  const userName = user?.name || 'there';
  const userInitials = (user?.name || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setErrorMessage] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialWelcome = useMemo(
    () => `Hi ${userName}! I'm your SpendWise AI assistant. I am connected directly to your authentic transaction records, budgets, and savings goals. Ask me anything about your spending, trends, or budget status!`,
    [userName]
  );

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      from: 'ai',
      text: initialWelcome,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const quickQuestions = [
    'Where did I spend the most?',
    'How much did I spend this month?',
    'How much did I save?',
    'Show my budget status',
    'Am I spending more than last month?',
    'Where can I reduce unnecessary spending?',
  ];

  const ask = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;

    setErrorMessage(null);
    setLastFailedQuestion(null);
    setQuestion('');

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      from: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build conversation history (up to last 6 messages)
      const historyPayload = messages
        .filter((m) => !m.error)
        .slice(-6)
        .map((m) => ({
          role: (m.from === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.text,
        }));

      const res = await ApiService.chatWithAI(trimmed, historyPayload);
      const answer = res?.message || res?.data?.message || 'I could not generate an analysis at this moment.';
      const provider = res?.metadata?.provider || res?.data?.metadata?.provider;

      const aiMsg: MessageItem = {
        id: `ai-${Date.now()}`,
        from: 'ai',
        text: answer,
        provider,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('AI chat error:', err);
      const friendlyError = err?.message?.includes('429')
        ? 'Too many requests. Please wait a moment before asking again.'
        : err?.message?.includes('401')
        ? 'Session expired. Please log in again to access the AI assistant.'
        : 'Unable to analyze finances at this moment. Please try again.';

      setErrorMessage(friendlyError);
      setLastFailedQuestion(trimmed);

      const errAiMsg: MessageItem = {
        id: `err-${Date.now()}`,
        from: 'ai',
        text: friendlyError,
        error: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errAiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        from: 'ai',
        text: `Chat cleared. Hi ${userName}! How can I help you with your finances today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setErrorMessage(null);
    setLastFailedQuestion(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Your financial co-pilot"
        title="AI assistant"
        description="Ask questions about your money. Answers are calculated from your authentic SpendWise data."
      />
      <div className="assistant-layout">
        <div className="card chat-card">
          <div className="chat-header">
            <span className="assistant-avatar">
              <Sparkles size={18} />
            </span>
            <div>
              <strong>Spendwise AI Assistant</strong>
              <span>
                <i className="online-dot" />
                Connected to your real financial data
              </span>
            </div>
            <button
              className="chat-clear-btn"
              onClick={handleClearChat}
              title="Clear conversation history"
              aria-label="Clear chat"
            >
              <RefreshCw size={13} />
              <span>Clear</span>
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((message) => (
              <div
                className={`message ${message.from}${message.error ? ' error-message' : ''}`}
                key={message.id}
              >
                <span className="message-avatar">
                  {message.from === 'ai' ? <Sparkles size={14} /> : userInitials}
                </span>
                <div>
                  <FormattedMessageText text={message.text} />
                  {message.error && lastFailedQuestion && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        className="retry-link"
                        onClick={() => ask(lastFailedQuestion)}
                      >
                        Try again
                      </button>
                    </div>
                  )}
                  <div className="message-footer">
                    <span>{message.timestamp}</span>
                    {message.from === 'ai' && !message.error && (
                      <span className="ai-badge">
                        <Sparkles size={10} /> SpendWise AI
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message ai">
                <span className="message-avatar">
                  <Sparkles size={14} />
                </span>
                <div className="typing-bubble">
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>Analyzing your finances...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="suggestions">
            <span>Quick questions</span>
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>

          <form
            className="chat-input"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              ask(question);
            }}
          >
            <input
              value={question}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setQuestion(event.target.value)}
              placeholder="Ask anything about your finances (e.g. How much did I spend on food?)..."
              aria-label="Ask Spendwise assistant"
              disabled={loading}
            />
            <button aria-label="Send question" type="submit" disabled={loading || !question.trim()}>
              <ArrowUpRight size={18} />
            </button>
          </form>
          <p className="disclaimer">SpendWise AI provides educational insights and data summaries based on your authenticated financial records.</p>
        </div>

        <div className="assistant-side">
          <div className="card">
            <CardHeading title="Suggested prompts" subtitle="Get a clearer picture" />
            <div className="prompt-list">
              <button onClick={() => ask('What changed this month?')} disabled={loading}>
                <TrendingUp size={17} />
                What changed this month?
                <ChevronRight size={15} />
              </button>
              <button onClick={() => ask('Where can I reduce unnecessary spending?')} disabled={loading}>
                <Lightbulb size={17} />
                Where can I cut back?
                <ChevronRight size={15} />
              </button>
              <button onClick={() => ask('How much did I save this month?')} disabled={loading}>
                <Target size={17} />
                Explain my savings rate
                <ChevronRight size={15} />
              </button>
              <button onClick={() => ask('What are my biggest expenses?')} disabled={loading}>
                <CreditCard size={17} />
                Biggest expenses
                <ChevronRight size={15} />
              </button>
              <button onClick={() => ask('How close am I to my savings goals?')} disabled={loading}>
                <CircleDollarSign size={17} />
                Savings goal progress
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
          <div className="card ai-trust">
            <ShieldCheck size={20} />
            <strong>Authenticated & Secure</strong>
            <p>Your financial assistant communicates directly with your authenticated backend. Only you can view insights generated from your private transaction and budget data.</p>
          </div>
        </div>
      </div>
    </>
  );
}

function SettingsPanel({
  theme,
  setTheme,
  syncData,
  exportData,
  setToast,
}: {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  syncData: () => Promise<void>;
  exportData: () => void;
  setToast: (message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'data'>('general');
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [syncing, setSyncing] = useState(false);

  return (
    <>
      <PageHeader eyebrow="Make it yours" title="Settings" description="Manage your preferences and keep your workspace feeling right." />
      <div className="settings-layout">
        <div className="settings-nav">
          <button className={activeTab === 'general' ? 'active' : ''} onClick={() => setActiveTab('general')}>
            <Settings size={17} />
            General
          </button>
          <button className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}>
            <Bell size={17} />
            Notifications
          </button>
          <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>
            <ShieldCheck size={17} />
            Security
          </button>
          <button className={activeTab === 'data' ? 'active' : ''} onClick={() => setActiveTab('data')}>
            <Database size={17} />
            Data management
          </button>
        </div>
        <div className="settings-content">
          {(activeTab === 'general' || activeTab === 'notifications' || activeTab === 'security' || activeTab === 'data') && (
            <section className="settings-section">
              <div>
                <h2>Appearance</h2>
                <p>Choose how Spendwise looks across this device.</p>
              </div>
              <div className="theme-options">
                {(['light', 'dark', 'system'] as ThemePreference[]).map(option => (
                  <button
                    key={option}
                    className={theme === option ? 'selected' : ''}
                    onClick={() => {
                      setTheme(option);
                      setToast(`${option === 'system' ? 'System theme' : option === 'light' ? 'Light' : 'Dark'} enabled`);
                    }}
                  >
                    <span className="theme-preview" data-preview={option}>
                      {option === 'light' ? <Sun size={19} /> : option === 'dark' ? <Moon size={19} /> : <Monitor size={19} />}
                    </span>
                    <span>
                      <strong>{option === 'system' ? 'System theme' : option === 'light' ? 'Light mode' : 'Dark mode'}</strong>
                      <small>{option === 'system' ? 'Follow your device preference' : option === 'light' ? 'Bright, calm, and focused' : 'Easy on the eyes'}</small>
                    </span>
                    {theme === option && <Check size={17} />}
                  </button>
                ))}
              </div>
            </section>
          )}
          {(activeTab === 'general' || activeTab === 'security') && (
            <section className="settings-section">
              <div>
                <h2>Profile</h2>
                <p>Your personal details and workspace identity.</p>
              </div>
              <form
                className="settings-form"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  setToast('Profile saved');
                }}
              >
                <label>
                  Full name
                  <input value={fullName} onChange={e => setFullName(e.target.value)} />
                </label>
                <label>
                  Email address
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </label>
                <Button type="submit">Save changes</Button>
              </form>
            </section>
          )}
          {(activeTab === 'general' || activeTab === 'data') && (
            <section className="settings-section data-section">
              <div>
                <h2>Data management</h2>
                <p>Your workspace financial data is securely synchronized with your PostgreSQL database.</p>
              </div>
              <div className="data-actions">
                <Button variant="secondary" onClick={exportData} icon={<Download size={16} />}>
                  Export data (JSON)
                </Button>
                <Button
                  variant="ghost"
                  disabled={syncing}
                  onClick={async () => {
                    setSyncing(true);
                    try {
                      await syncData();
                    } finally {
                      setSyncing(false);
                    }
                  }}
                  icon={<RefreshCw size={16} />}
                >
                  {syncing ? 'Syncing...' : 'Sync with server'}
                </Button>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function Modal({ title, description, children, onClose }: { title: string; description: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <div>
            <h2 id="modal-title">{title}</h2>
            <p>{description}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function TransactionModal({
  initial,
  categoriesList = [],
  onClose,
  onSave,
}: {
  initial?: Transaction;
  categoriesList?: ApiCategory[];
  onClose: () => void;
  onSave: (transaction: Transaction) => Promise<void> | void;
}) {
  const [form, setForm] = useState<Transaction>(
    initial || {
      id: `t-${Date.now()}`,
      merchant: '',
      category: 'Dining',
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      type: 'expense',
      account: 'Checking',
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Extract distinct category options from categoriesList or fallback
  const availableCategories = useMemo(() => {
    if (categoriesList.length > 0) {
      const filtered = categoriesList.filter((c) =>
        form.type === 'income' ? c.type === 'INCOME' : c.type === 'EXPENSE'
      );
      if (filtered.length > 0) return filtered.map((c) => c.name);
    }
    return form.type === 'income'
      ? ['Income']
      : ['Dining', 'Groceries', 'Housing', 'Transport', 'Subscriptions', 'Shopping', 'Health', 'Education', 'Entertainment'];
  }, [categoriesList, form.type]);

  const update = (key: keyof Transaction, value: string | number) => {
    setForm((current) => {
      const updated = { ...current, [key]: value };
      if (key === 'type') {
        if (value === 'income') {
          updated.category = 'Income';
        } else if (value === 'expense' && updated.category === 'Income') {
          updated.category = 'Dining';
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const numAmount = Math.abs(Number(form.amount));
    if (!form.merchant.trim()) {
      setError('Merchant name or description is required.');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }
    if (!form.date) {
      setError('Date is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, merchant: form.merchant.trim(), amount: numAmount });
    } catch (err: any) {
      setError(err?.message || 'Failed to save transaction.');
      setSaving(false);
    }
  };

  return (
    <Modal title={initial ? 'Edit transaction' : 'Add transaction'} description="Keep your activity accurate and up to date." onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="form-error" style={{ marginBottom: '14px' }}>{error}</div>}
        <div className="form-grid">
          <FormField label="Merchant / Description">
            <input
              required
              value={form.merchant}
              onChange={(event) => update('merchant', event.target.value)}
              placeholder="e.g. Whole Foods Market"
              disabled={saving}
            />
          </FormField>
          <FormField label="Amount">
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount || ''}
              onChange={(event) => update('amount', event.target.value)}
              placeholder="0.00"
              disabled={saving}
            />
          </FormField>
          <FormField label="Type">
            <select value={form.type} onChange={(event) => update('type', event.target.value as 'income' | 'expense')} disabled={saving}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </FormField>
          <FormField label="Category">
            <select value={form.category} onChange={(event) => update('category', event.target.value)} disabled={saving}>
              {availableCategories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Date">
            <input required type="date" value={form.date} onChange={(event) => update('date', event.target.value)} disabled={saving} />
          </FormField>
          <FormField label="Account">
            <select value={form.account} onChange={(event) => update('account', event.target.value)} disabled={saving}>
              <option>Checking</option>
              <option>Visa •••• 4421</option>
              <option>Savings</option>
            </select>
          </FormField>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : initial ? 'Save changes' : 'Add transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function BudgetModal({
  categoriesList = [],
  onClose,
  onSave,
}: {
  categoriesList?: ApiCategory[];
  onClose: () => void;
  onSave: (budget: Budget) => Promise<void> | void;
}) {
  const [category, setCategory] = useState('Dining');
  const [limit, setLimit] = useState('300');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const availableCategories = useMemo(() => {
    if (categoriesList.length > 0) {
      const expenseCats = categoriesList.filter((c) => c.type === 'EXPENSE').map((c) => c.name);
      if (expenseCats.length > 0) return expenseCats;
    }
    return ['Housing', 'Groceries', 'Dining', 'Transport', 'Subscriptions', 'Shopping', 'Health', 'Education', 'Entertainment'];
  }, [categoriesList]);

  useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.includes(category)) {
      setCategory(availableCategories[0]);
    }
  }, [availableCategories, category]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const numLimit = Math.max(1, Number(limit));
    if (!numLimit || isNaN(numLimit)) {
      setError('Please enter a valid limit amount.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ id: `b-${Date.now()}`, category, limit: numLimit });
    } catch (err: any) {
      setError(err?.message || 'Failed to create budget.');
      setSaving(false);
    }
  };

  return (
    <Modal title="Create a budget" description="Set a monthly limit for a spending category." onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="form-error" style={{ marginBottom: '14px' }}>{error}</div>}
        <div className="form-grid">
          <FormField label="Category">
            <select value={category} onChange={(event) => setCategory(event.target.value)} disabled={saving}>
              {availableCategories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Monthly limit">
            <input
              type="number"
              min="1"
              step="1"
              required
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              disabled={saving}
            />
          </FormField>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function GoalModal({ onClose, onSave }: { onClose: () => void; onSave: (goal: Goal) => Promise<void> | void }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('1000');
  const [date, setDate] = useState('2026-12-31');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Goal name is required.');
      return;
    }
    const numTarget = Math.max(1, Number(target));
    if (!numTarget || isNaN(numTarget)) {
      setError('Please enter a valid target amount.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        id: `g-${Date.now()}`,
        name: name.trim(),
        target: numTarget,
        saved: 0,
        date,
        color: '#22a06b',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to create goal.');
      setSaving(false);
    }
  };

  return (
    <Modal title="New savings goal" description="Give a name to something worth saving for." onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="form-error" style={{ marginBottom: '14px' }}>{error}</div>}
        <FormField label="Goal name">
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. New laptop"
            disabled={saving}
          />
        </FormField>
        <div className="form-grid">
          <FormField label="Target amount">
            <input
              type="number"
              min="1"
              step="1"
              required
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              disabled={saving}
            />
          </FormField>
          <FormField label="Target date">
            <input
              type="date"
              required
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={saving}
            />
          </FormField>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function UploadModal({ onClose, onImport }: { onClose: () => void; onImport: (transactions: Transaction[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<Transaction[]>([]);
  const [error, setError] = useState('');

  const parse = (file: File) => {
    setError('');
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setError('The uploaded CSV file is empty or missing data rows.');
          return;
        }

        const rawHeaderLine = lines.shift() || '';
        const headers = parseCsvLine(rawHeaderLine).map(h => h.toLowerCase().replace(/['"]/g, '').trim());

        const merchantIndex = headers.findIndex(item => ['merchant', 'description', 'name', 'payee', 'title'].includes(item));
        const amountIndex = headers.findIndex(item => ['amount', 'value', 'total', 'price', 'debit'].includes(item));
        const dateIndex = headers.findIndex(item => ['date', 'transaction date', 'posted date', 'time'].includes(item));
        const categoryIndex = headers.findIndex(item => ['category', 'type'].includes(item));

        if (merchantIndex < 0 || amountIndex < 0 || dateIndex < 0) {
          setError('We need merchant, amount, and date columns in the header row to import this file.');
          return;
        }

        const parsed: Transaction[] = lines
          .map((line, index) => {
            const values = parseCsvLine(line);
            const cleanMerchant = values[merchantIndex] || 'Imported transaction';
            const cleanDateRaw = values[dateIndex] || '';
            const rawAmountStr = (values[amountIndex] || '0').replace(/[$,\s]/g, '');
            const rawAmount = parseFloat(rawAmountStr) || 0;
            const customCategory = categoryIndex >= 0 && values[categoryIndex] ? values[categoryIndex] : 'Shopping';

            let validDate = cleanDateRaw;
            if (cleanDateRaw.includes('/')) {
              const parts = cleanDateRaw.split('/');
              if (parts.length === 3) {
                const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                validDate = `${y}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
              }
            }

            return {
              id: `csv-${Date.now()}-${index}`,
              merchant: cleanMerchant,
              category: categories.includes(customCategory) ? customCategory : 'Shopping',
              date: validDate || new Date().toISOString().slice(0, 10),
              amount: Math.abs(rawAmount),
              type: (rawAmount < 0 ? 'expense' : 'income') as 'income' | 'expense',
              account: 'Imported CSV',
            };
          })
          .filter(item => item.merchant && item.amount > 0);

        if (parsed.length === 0) {
          setError('No valid transactions could be parsed from the file.');
          return;
        }

        setRows(parsed);
      } catch (err) {
        setError(`Failed to read CSV file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    reader.readAsText(file);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) parse(file);
  };

  return (
    <Modal title="Import transactions" description="Bring in a CSV export from your bank. Your file stays in this browser." onClose={onClose}>
      <div
        className="upload-zone"
        onClick={() => inputRef.current?.click()}
        onDragOver={event => event.preventDefault()}
        onDrop={event => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file) parse(file);
        }}
      >
        <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleFile} hidden />
        {rows.length ? (
          <>
            <span className="upload-success">
              <Check size={24} />
            </span>
            <strong>{fileName}</strong>
            <span>{rows.length} valid rows ready to import</span>
          </>
        ) : (
          <>
            <span className="upload-icon">
              <CloudUpload size={24} />
            </span>
            <strong>Drop a CSV here or browse</strong>
            <span>CSV files up to 10MB · Include date, merchant, and amount</span>
          </>
        )}
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      {rows.length > 0 && (
        <div className="csv-preview">
          <span className="eyebrow">Preview</span>
          {rows.slice(0, 3).map(row => (
            <div key={row.id}>
              <span>{row.merchant}</span>
              <strong>
                {row.type === 'income' ? '+' : '-'}
                {preciseMoney(row.amount)}
              </strong>
            </div>
          ))}
        </div>
      )}
      <div className="modal-actions">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => onImport(rows)} disabled={!rows.length}>
          Import {rows.length || ''} transactions
        </Button>
      </div>
    </Modal>
  );
}

function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="empty-state">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export default App;

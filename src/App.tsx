import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
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
type Transaction = { id: string; merchant: string; category: string; date: string; amount: number; type: 'income' | 'expense'; account: string };
type Budget = { id: string; category: string; limit: number };
type Goal = { id: string; name: string; target: number; saved: number; date: string; color: string };

type IconType = typeof LayoutDashboard;

const categoryColors: Record<string, string> = { Housing: '#5078e5', Groceries: '#22a06b', Dining: '#f59e0b', Transport: '#a855f7', Subscriptions: '#ef6b73', Shopping: '#ef8354', Health: '#10b8b0', Education: '#64748b', Entertainment: '#e879f9', Income: '#22a06b' };
const categories = ['All', 'Housing', 'Groceries', 'Dining', 'Transport', 'Subscriptions', 'Shopping', 'Health', 'Education', 'Entertainment'];

const seedTransactions: Transaction[] = [
  { id: 't1', merchant: 'Northstar Payroll', category: 'Income', date: '2026-06-01', amount: 5400, type: 'income', account: 'Checking' },
  { id: 't2', merchant: 'Juniper Apartments', category: 'Housing', date: '2026-06-02', amount: 1650, type: 'expense', account: 'Checking' },
  { id: 't3', merchant: 'Whole Foods Market', category: 'Groceries', date: '2026-06-04', amount: 128.46, type: 'expense', account: 'Visa •••• 4421' },
  { id: 't4', merchant: 'The Daily Press', category: 'Dining', date: '2026-06-06', amount: 18.25, type: 'expense', account: 'Visa •••• 4421' },
  { id: 't5', merchant: 'Metro Transit', category: 'Transport', date: '2026-06-07', amount: 42, type: 'expense', account: 'Visa •••• 4421' },
  { id: 't6', merchant: 'Luma Streaming', category: 'Subscriptions', date: '2026-06-08', amount: 14.99, type: 'expense', account: 'Visa •••• 4421' },
  { id: 't7', merchant: 'Brightline Studios', category: 'Income', date: '2026-05-15', amount: 850, type: 'income', account: 'Checking' },
  { id: 't8', merchant: 'Northstar Payroll', category: 'Income', date: '2026-05-01', amount: 5400, type: 'income', account: 'Checking' },
  { id: 't9', merchant: 'Juniper Apartments', category: 'Housing', date: '2026-05-02', amount: 1650, type: 'expense', account: 'Checking' },
  { id: 't10', merchant: 'Fresh Market', category: 'Groceries', date: '2026-05-08', amount: 214.8, type: 'expense', account: 'Visa •••• 4421' },
  { id: 't11', merchant: 'Kite & Co.', category: 'Shopping', date: '2026-05-12', amount: 179, type: 'expense', account: 'Visa •••• 4421' },
  { id: 't12', merchant: 'The Green Table', category: 'Dining', date: '2026-05-18', amount: 68.4, type: 'expense', account: 'Visa •••• 4421' },
  { id: 't13', merchant: 'Northstar Payroll', category: 'Income', date: '2026-04-01', amount: 5400, type: 'income', account: 'Checking' },
  { id: 't14', merchant: 'Juniper Apartments', category: 'Housing', date: '2026-04-02', amount: 1650, type: 'expense', account: 'Checking' },
  { id: 't15', merchant: 'Fresh Market', category: 'Groceries', date: '2026-04-10', amount: 156.32, type: 'expense', account: 'Visa •••• 4421' },
  { id: 't16', merchant: 'CloudDesk Pro', category: 'Subscriptions', date: '2026-04-11', amount: 29, type: 'expense', account: 'Visa •••• 4421' },
  { id: 't17', merchant: 'HealthFirst Pharmacy', category: 'Health', date: '2026-04-19', amount: 64.75, type: 'expense', account: 'Visa •••• 4421' },
  { id: 't18', merchant: 'Northstar Payroll', category: 'Income', date: '2026-03-01', amount: 5400, type: 'income', account: 'Checking' },
  { id: 't19', merchant: 'Juniper Apartments', category: 'Housing', date: '2026-03-02', amount: 1650, type: 'expense', account: 'Checking' },
  { id: 't20', merchant: 'Atlas Flights', category: 'Shopping', date: '2026-03-14', amount: 480, type: 'expense', account: 'Visa •••• 4421' },
  { id: 't21', merchant: 'The Green Table', category: 'Dining', date: '2026-03-22', amount: 92.16, type: 'expense', account: 'Visa •••• 4421' },
  { id: 't22', merchant: 'Northstar Payroll', category: 'Income', date: '2026-02-01', amount: 5400, type: 'income', account: 'Checking' },
  { id: 't23', merchant: 'Juniper Apartments', category: 'Housing', date: '2026-02-02', amount: 1650, type: 'expense', account: 'Checking' },
  { id: 't24', merchant: 'Market Street Grocer', category: 'Groceries', date: '2026-02-11', amount: 186.74, type: 'expense', account: 'Visa •••• 4421' },
];
const seedBudgets: Budget[] = [
  { id: 'b1', category: 'Housing', limit: 1800 },
  { id: 'b2', category: 'Groceries', limit: 500 },
  { id: 'b3', category: 'Dining', limit: 300 },
  { id: 'b4', category: 'Shopping', limit: 400 },
];
const seedGoals: Goal[] = [
  { id: 'g1', name: 'Emergency fund', target: 10000, saved: 6800, date: '2026-12-31', color: '#22a06b' },
  { id: 'g2', name: 'Japan trip', target: 3500, saved: 1900, date: '2027-04-01', color: '#5078e5' },
  { id: 'g3', name: 'New workspace', target: 2400, saved: 820, date: '2026-11-15', color: '#a855f7' },
];

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
  const [theme, setTheme] = useStoredState<ThemePreference>('spendwise-theme', 'system');
  const [transactions, setTransactions] = useStoredState<Transaction[]>('spendwise-transactions', seedTransactions);
  const [budgets, setBudgets] = useStoredState<Budget[]>('spendwise-budgets', seedBudgets);
  const [goals, setGoals] = useStoredState<Goal[]>('spendwise-goals', seedGoals);
  const [page, setPage] = useState<Page>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [modal, setModal] = useState<'transaction' | 'budget' | 'goal' | 'upload' | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [toast, setToast] = useState('');

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

  const resetDemo = () => {
    setTransactions(seedTransactions);
    setBudgets(seedBudgets);
    setGoals(seedGoals);
    setToast('Demo data restored');
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

  const addTransaction = (transaction: Transaction) => {
    setTransactions(current => [transaction, ...current]);
    setModal(null);
    setToast('Transaction added');
  };

  const saveTransaction = (transaction: Transaction) => {
    setTransactions(current => current.map(item => (item.id === transaction.id ? transaction : item)));
    setEditingTransaction(null);
    setToast('Transaction updated');
  };

  const deleteTransaction = (id: string) => {
    setTransactions(current => current.filter(item => item.id !== id));
    setToast('Transaction removed');
  };

  const addBudget = (budget: Budget) => {
    setBudgets(current => [...current, budget]);
    setModal(null);
    setToast('Budget created');
  };

  const addGoal = (goal: Goal) => {
    setGoals(current => [...current, goal]);
    setModal(null);
    setToast('Savings goal created');
  };

  const contribute = (id: string) => {
    setGoals(current =>
      current.map(goal => (goal.id === id ? { ...goal, saved: Math.min(goal.target, goal.saved + 250) } : goal))
    );
    setToast('Contribution added');
  };

  const importTransactions = (incoming: Transaction[]) => {
    setTransactions(current => [
      ...incoming.filter(
        item =>
          !current.some(
            existing => existing.merchant === item.merchant && existing.date === item.date && existing.amount === item.amount
          )
      ),
      ...current,
    ]);
    setModal(null);
    setToast(`${incoming.length} rows checked and imported`);
  };

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        navigate={navigate}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        transactionCount={transactions.length}
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
              <span className="avatar">AM</span>
              <span className="profile-name">Alex Morgan</span>
              <ChevronDown size={15} />
            </div>
          </div>
        </header>
        <main className="page-content">
          {page === 'dashboard' && <Dashboard transactions={transactions} budgets={budgets} navigate={navigate} onAdd={() => setModal('transaction')} />}
          {page === 'transactions' && (
            <Transactions
              transactions={transactions}
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
              onDelete={id => {
                setBudgets(current => current.filter(item => item.id !== id));
                setToast('Budget removed');
              }}
            />
          )}
          {page === 'savings' && (
            <Savings
              goals={goals}
              onAdd={() => setModal('goal')}
              onContribute={contribute}
              onDelete={id => {
                setGoals(current => current.filter(item => item.id !== id));
                setToast('Goal removed');
              }}
            />
          )}
          {page === 'assistant' && <Assistant transactions={transactions} budgets={budgets} goals={goals} />}
          {page === 'settings' && <SettingsPanel theme={theme} setTheme={setTheme} resetDemo={resetDemo} exportData={exportData} setToast={setToast} />}
        </main>
      </div>
      {modal === 'transaction' && <TransactionModal onClose={() => setModal(null)} onSave={addTransaction} />}
      {modal === 'budget' && <BudgetModal onClose={() => setModal(null)} onSave={addBudget} />}
      {modal === 'goal' && <GoalModal onClose={() => setModal(null)} onSave={addGoal} />}
      {modal === 'upload' && <UploadModal onClose={() => setModal(null)} onImport={importTransactions} />}
      {editingTransaction && <TransactionModal initial={editingTransaction} onClose={() => setEditingTransaction(null)} onSave={saveTransaction} />}
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

function Sidebar({
  page,
  navigate,
  mobileOpen,
  onClose,
  transactionCount,
}: {
  page: Page;
  navigate: (page: Page) => void;
  mobileOpen: boolean;
  onClose: () => void;
  transactionCount: number;
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
        <div className="sidebar-user">
          <span className="avatar">AM</span>
          <div>
            <strong>Alex Morgan</strong>
            <span>Free workspace</span>
          </div>
          <MoreHorizontal size={17} />
        </div>
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
        title="Good morning, Alex"
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
        <StatCard label="Total balance" value={money(18420 + savings)} change="8.4%" icon={<Wallet size={18} />} />
        <StatCard label="Total income" value={money(income)} change="5.2%" icon={<ArrowDownRight size={18} />} />
        <StatCard label="Total expenses" value={money(expense)} change="2.1%" positive={false} icon={<ArrowUpRight size={18} />} />
        <StatCard label="Savings rate" value={`${savingsRate}%`} change="4.8%" icon={<Target size={18} />} />
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
  onAdd,
  onUpload,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  onAdd: () => void;
  onUpload: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [type, setType] = useState('All');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(
    () =>
      transactions
        .filter(t => `${t.merchant} ${t.category}`.toLowerCase().includes(query.toLowerCase()))
        .filter(t => category === 'All' || t.category === category)
        .filter(t => type === 'All' || t.type === type)
        .sort((a, b) => (sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date))),
    [transactions, query, category, type, sortAsc]
  );

  return (
    <>
      <PageHeader
        eyebrow="Activity"
        title="Transactions"
        description="Review, categorize, and stay close to every dollar."
        action={
          <div className="header-actions">
            <Button variant="secondary" onClick={onUpload} icon={<CloudUpload size={16} />}>
              Import CSV
            </Button>
            <Button onClick={onAdd} icon={<Plus size={17} />}>
              Add transaction
            </Button>
          </div>
        }
      />
      <div className="card table-card">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search transactions..."
              aria-label="Search transactions"
            />
          </div>
          <div className="filter-group">
            <select value={category} onChange={event => setCategory(event.target.value)} aria-label="Filter by category">
              {categories.map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select value={type} onChange={event => setType(event.target.value)} aria-label="Filter by transaction type">
              <option value="All">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
            <button className="icon-button" aria-label="Change sort order" onClick={() => setSortAsc(current => !current)}>
              <ListFilter size={17} />
            </button>
          </div>
        </div>
        <div className="table-summary">
          <span>
            Showing <strong>{filtered.length}</strong> transactions
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
              {filtered.map(transaction => (
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
          {filtered.length === 0 && (
            <EmptyState icon={<Search size={24} />} title="No transactions found" description="Try a different search or clear your filters." />
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

function Assistant({
  transactions,
  budgets,
  goals,
}: {
  transactions: Transaction[];
  budgets?: Budget[];
  goals?: Goal[];
}) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<{ from: 'ai' | 'user'; text: string }[]>([
    {
      from: 'ai',
      text: 'Hi Alex. I can help you understand your spending, find patterns, and make a plan from your Spendwise data.',
    },
  ]);

  const expenseTransactions = useMemo(() => transactions.filter(t => t.type === 'expense'), [transactions]);
  const incomeTransactions = useMemo(() => transactions.filter(t => t.type === 'income'), [transactions]);
  const totalExpense = useMemo(() => expenseTransactions.reduce((s, t) => s + t.amount, 0), [expenseTransactions]);
  const totalIncome = useMemo(() => incomeTransactions.reduce((s, t) => s + t.amount, 0), [incomeTransactions]);

  const topCategoryData = useMemo(() => {
    const map = expenseTransactions.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0];
  }, [expenseTransactions]);

  const ask = (value: string) => {
    if (!value.trim()) return;
    const lower = value.toLowerCase();
    let answer = '';

    if (lower.includes('what changed') || (lower.includes('month') && lower.includes('change'))) {
      const monthSet = Array.from(new Set(transactions.map(t => t.date.slice(0, 7)).filter(Boolean))).sort();
      if (monthSet.length >= 2) {
        const curMonth = monthSet[monthSet.length - 1];
        const prevMonth = monthSet[monthSet.length - 2];
        const curSpent = transactions.filter(t => t.type === 'expense' && t.date.startsWith(curMonth)).reduce((s, t) => s + t.amount, 0);
        const prevSpent = transactions.filter(t => t.type === 'expense' && t.date.startsWith(prevMonth)).reduce((s, t) => s + t.amount, 0);
        const diff = curSpent - prevSpent;
        const diffPercent = prevSpent > 0 ? Math.round((Math.abs(diff) / prevSpent) * 100) : 0;
        answer = `Comparing ${monthLabel(curMonth)} (${money(curSpent)}) with ${monthLabel(prevMonth)} (${money(prevSpent)}), spending is ${
          diff >= 0 ? `up by ${money(diff)} (+${diffPercent}%)` : `down by ${money(Math.abs(diff))} (-${diffPercent}%)`
        }.`;
      } else {
        answer = `In the latest period, your total recorded spending is ${money(totalExpense)} across ${expenseTransactions.length} transactions.`;
      }
    } else if (lower.includes('cut back') || lower.includes('save more') || lower.includes('reduce')) {
      const discretionary = expenseTransactions
        .filter(t => ['Dining', 'Shopping', 'Entertainment', 'Subscriptions'].includes(t.category))
        .reduce((s, t) => s + t.amount, 0);
      answer = `To boost savings, consider reviewing discretionary expenses like Dining, Shopping, and Subscriptions, which totaled ${money(
        discretionary
      )}. Trimming 15% would save you approximately ${money(discretionary * 0.15)} monthly.`;
    } else if (lower.includes('rate') || (lower.includes('explain') && lower.includes('sav'))) {
      const netSavings = totalIncome - totalExpense;
      const rate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
      answer = `Your overall savings rate is ${rate}%. You earned ${money(totalIncome)} and spent ${money(
        totalExpense
      )}, leaving ${money(netSavings)} saved. Aiming for 20%+ is a standard financial milestone.`;
    } else if (lower.includes('largest') || lower.includes('top category') || lower.includes('most')) {
      if (topCategoryData) {
        const percent = totalExpense > 0 ? Math.round((topCategoryData[1] / totalExpense) * 100) : 0;
        answer = `Your largest spending category is ${topCategoryData[0]} at ${money(topCategoryData[1])}, accounting for ${percent}% of total expenses.`;
      } else {
        answer = 'No expense transactions recorded yet.';
      }
    } else if (lower.includes('spend') || lower.includes('expense') || lower.includes('how much')) {
      answer = `You’ve spent ${money(totalExpense)} across ${expenseTransactions.length} transactions in the current recorded period.`;
    } else if (lower.includes('budget')) {
      if (budgets && budgets.length > 0) {
        const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
        answer = `You have ${budgets.length} active budgets totaling ${money(totalBudget)}. Track your limits on the Budgets page.`;
      } else {
        answer = 'You haven’t set any monthly budgets yet. Head over to Budgets to create your first one.';
      }
    } else if (lower.includes('goal')) {
      if (goals && goals.length > 0) {
        const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
        const totalTarget = goals.reduce((s, g) => s + g.target, 0);
        answer = `You have ${goals.length} savings goals. You’ve saved ${money(totalSaved)} toward a total goal of ${money(totalTarget)}.`;
      } else {
        answer = 'No savings goals created yet. You can set one on the Savings Goals tab!';
      }
    } else {
      answer = topCategoryData
        ? `Based on your recent activity, your top spending is ${topCategoryData[0]} at ${money(topCategoryData[1])}. Total spending is ${money(
            totalExpense
          )} against ${money(totalIncome)} in income.`
        : 'Your financial co-pilot is ready to analyze your spending, transactions, and budgets.';
    }

    setMessages(current => [...current, { from: 'user', text: value }, { from: 'ai', text: answer }]);
    setQuestion('');
  };

  return (
    <>
      <PageHeader
        eyebrow="Your financial co-pilot"
        title="AI assistant"
        description="Ask questions about your money. Answers are based on your local Spendwise data."
      />
      <div className="assistant-layout">
        <div className="card chat-card">
          <div className="chat-header">
            <span className="assistant-avatar">
              <Sparkles size={18} />
            </span>
            <div>
              <strong>Spendwise assistant</strong>
              <span>
                <i className="online-dot" />
                Ready to help
              </span>
            </div>
            <button className="icon-button" aria-label="Assistant settings">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div className={`message ${message.from}`} key={`${message.from}-${index}`}>
                <span className="message-avatar">{message.from === 'ai' ? <Sparkles size={14} /> : 'AM'}</span>
                <div>{message.text}</div>
              </div>
            ))}
          </div>
          <div className="suggestions">
            <span>Try asking</span>
            <button onClick={() => ask('How much did I spend?')}>How much did I spend?</button>
            <button onClick={() => ask('What is my largest category?')}>Largest category?</button>
            <button onClick={() => ask('How can I save more?')}>How can I save more?</button>
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
              onChange={event => setQuestion(event.target.value)}
              placeholder="Ask anything about your finances..."
              aria-label="Ask Spendwise assistant"
            />
            <button aria-label="Send question" type="submit">
              <ArrowUpRight size={18} />
            </button>
          </form>
          <p className="disclaimer">Spendwise provides educational insights, not professional financial advice.</p>
        </div>
        <div className="assistant-side">
          <div className="card">
            <CardHeading title="Suggested prompts" subtitle="Get a clearer picture" />
            <div className="prompt-list">
              <button onClick={() => ask('What changed this month?')}>
                <TrendingUp size={17} />
                What changed this month?
                <ChevronRight size={15} />
              </button>
              <button onClick={() => ask('Where can I cut back?')}>
                <Lightbulb size={17} />
                Where can I cut back?
                <ChevronRight size={15} />
              </button>
              <button onClick={() => ask('Explain my savings rate')}>
                <Target size={17} />
                Explain my savings rate
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
          <div className="card ai-trust">
            <ShieldCheck size={20} />
            <strong>Private by design</strong>
            <p>Your demo data stays in this browser. No financial information is sent anywhere.</p>
          </div>
        </div>
      </div>
    </>
  );
}

function SettingsPanel({
  theme,
  setTheme,
  resetDemo,
  exportData,
  setToast,
}: {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  resetDemo: () => void;
  exportData: () => void;
  setToast: (message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'data'>('general');
  const [fullName, setFullName] = useState('Alex Morgan');
  const [email, setEmail] = useState('alex.morgan@example.com');

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
                <h2>Demo data</h2>
                <p>Everything is stored locally while the backend is being connected.</p>
              </div>
              <div className="data-actions">
                <Button variant="secondary" onClick={exportData} icon={<Download size={16} />}>
                  Export data
                </Button>
                <Button variant="ghost" onClick={resetDemo} icon={<RefreshCw size={16} />}>
                  Reset demo data
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
  onClose,
  onSave,
}: {
  initial?: Transaction;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
}) {
  const [form, setForm] = useState<Transaction>(
    initial || {
      id: `t-${Date.now()}`,
      merchant: '',
      category: 'Dining',
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      type: 'expense',
      account: 'Visa •••• 4421',
    }
  );

  const update = (key: keyof Transaction, value: string | number) => {
    setForm(current => {
      const updated = { ...current, [key]: value };
      if (key === 'type') {
        if (value === 'income' && updated.category !== 'Income') {
          updated.category = 'Income';
        } else if (value === 'expense' && updated.category === 'Income') {
          updated.category = 'Dining';
        }
      }
      return updated;
    });
  };

  return (
    <Modal title={initial ? 'Edit transaction' : 'Add transaction'} description="Keep your activity accurate and up to date." onClose={onClose}>
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          onSave({ ...form, amount: Math.abs(Number(form.amount)) });
        }}
      >
        <div className="form-grid">
          <FormField label="Merchant">
            <input required value={form.merchant} onChange={event => update('merchant', event.target.value)} placeholder="e.g. Whole Foods Market" />
          </FormField>
          <FormField label="Amount">
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount || ''}
              onChange={event => update('amount', event.target.value)}
              placeholder="0.00"
            />
          </FormField>
          <FormField label="Category">
            <select value={form.category} onChange={event => update('category', event.target.value)}>
              {categories.slice(1).map(item => (
                <option key={item}>{item}</option>
              ))}
              <option>Income</option>
            </select>
          </FormField>
          <FormField label="Type">
            <select value={form.type} onChange={event => update('type', event.target.value as 'income' | 'expense')}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </FormField>
          <FormField label="Date">
            <input required type="date" value={form.date} onChange={event => update('date', event.target.value)} />
          </FormField>
          <FormField label="Account">
            <select value={form.account} onChange={event => update('account', event.target.value)}>
              <option>Visa •••• 4421</option>
              <option>Checking</option>
              <option>Savings</option>
            </select>
          </FormField>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{initial ? 'Save changes' : 'Add transaction'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function BudgetModal({ onClose, onSave }: { onClose: () => void; onSave: (budget: Budget) => void }) {
  const [category, setCategory] = useState('Dining');
  const [limit, setLimit] = useState('300');

  return (
    <Modal title="Create a budget" description="Set a monthly limit for a spending category." onClose={onClose}>
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          onSave({ id: `b-${Date.now()}`, category, limit: Math.max(1, Number(limit)) });
        }}
      >
        <div className="form-grid">
          <FormField label="Category">
            <select value={category} onChange={event => setCategory(event.target.value)}>
              {categories.slice(1).map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Monthly limit">
            <input type="number" min="1" step="1" required value={limit} onChange={event => setLimit(event.target.value)} />
          </FormField>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create budget</Button>
        </div>
      </form>
    </Modal>
  );
}

function GoalModal({ onClose, onSave }: { onClose: () => void; onSave: (goal: Goal) => void }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('1000');
  const [date, setDate] = useState('2026-12-31');

  return (
    <Modal title="New savings goal" description="Give a name to something worth saving for." onClose={onClose}>
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          onSave({
            id: `g-${Date.now()}`,
            name: name.trim(),
            target: Math.max(1, Number(target)),
            saved: 0,
            date,
            color: '#22a06b',
          });
        }}
      >
        <FormField label="Goal name">
          <input required value={name} onChange={event => setName(event.target.value)} placeholder="e.g. New laptop" />
        </FormField>
        <div className="form-grid">
          <FormField label="Target amount">
            <input type="number" min="1" step="1" required value={target} onChange={event => setTarget(event.target.value)} />
          </FormField>
          <FormField label="Target date">
            <input type="date" required value={date} onChange={event => setDate(event.target.value)} />
          </FormField>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create goal</Button>
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

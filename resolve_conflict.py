import sys

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<<<<<<< HEAD'
end_marker = '>>>>>>> a63ebf3f2968492df852230ce81feaddc0702a02'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    actual_end_idx = content.find('\n', end_idx) + 1
    if actual_end_idx == 0:
        actual_end_idx = len(content)
        
    replacement = '''function pageTitle(page: Page) {
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
'''
    new_content = content[:start_idx] + replacement + content[actual_end_idx:]
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Conflict resolved in App.tsx')
else:
    print('Conflict markers not found in App.tsx!')

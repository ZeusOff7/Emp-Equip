import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, History, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout({ children }) {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Equipment', href: '/equipment', icon: Package },
    { name: 'Transactions', href: '/transactions', icon: History },
    { name: 'Reports', href: '/reports', icon: FileText },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-white" data-testid="main-layout">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900" data-testid="app-title">LoanTrek</h1>
          <p className="text-sm text-slate-600 mt-1">Equipment Loan System</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                data-testid={`nav-${item.name.toLowerCase()}`}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium
                  transition-colors duration-200
                  ${
                    isActive(item.href)
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }
                `}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <Link to="/equipment/new">
            <Button 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              data-testid="add-equipment-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
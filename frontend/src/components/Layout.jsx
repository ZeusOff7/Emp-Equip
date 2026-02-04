import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, History, FileText, Plus, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Layout({ children }) {
  const location = useLocation();
  const [overdueCount, setOverdueCount] = useState(0);
  const [overdueItems, setOverdueItems] = useState([]);
  const [checkInterval, setCheckInterval] = useState(3600000); // Default: 1 hour
  const [readNotifications, setReadNotifications] = useState([]);

  const navigation = [
    { name: 'Painel', href: '/', icon: LayoutDashboard },
    { name: 'Equipamentos', href: '/equipment', icon: Package },
    { name: 'Movimentações', href: '/transactions', icon: History },
    { name: 'Relatórios', href: '/reports', icon: FileText },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const fetchOverdue = async () => {
    try {
      const response = await axios.get(`${API}/overdue/detailed`);
      setOverdueItems(response.data.slice(0, 5)); // Show only first 5 in notification
      
      // Load read notifications from localStorage
      const stored = localStorage.getItem('readNotifications');
      const readIds = stored ? JSON.parse(stored) : [];
      setReadNotifications(readIds);
      
      // Count only unread notifications
      const unreadCount = response.data.filter(item => !readIds.includes(item.id)).length;
      setOverdueCount(unreadCount);
    } catch (error) {
      console.error('Erro ao buscar atrasos:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      const intervalHours = response.data.check_interval_hours || 1;
      setCheckInterval(intervalHours * 3600000); // Convert hours to milliseconds
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  };

  const markAsRead = (itemId) => {
    const newReadList = [...readNotifications, itemId];
    setReadNotifications(newReadList);
    localStorage.setItem('readNotifications', JSON.stringify(newReadList));
    
    // Update count
    const unreadCount = overdueItems.filter(item => !newReadList.includes(item.id)).length;
    setOverdueCount(unreadCount);
  };

  const markAllAsRead = () => {
    const allIds = overdueItems.map(item => item.id);
    setReadNotifications(allIds);
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
    setOverdueCount(0);
  };

  const clearReadNotifications = () => {
    setReadNotifications([]);
    localStorage.removeItem('readNotifications');
    fetchOverdue();
  };

  useEffect(() => {
    fetchOverdue();
    fetchSettings();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchOverdue();
    }, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval]);

  return (
    <div className="flex h-screen bg-white" data-testid="main-layout">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900" data-testid="app-title">CANSF</h1>
          <p className="text-sm text-slate-600 mt-1">Gestão de Empréstimos</p>
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
              Adicionar Equipamento
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Notifications */}
        <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-end px-8">
          <Popover>
            <PopoverTrigger asChild>
              <button 
                className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
                data-testid="notification-bell"
              >
                <Bell className="h-6 w-6 text-slate-700" strokeWidth={1.5} />
                {overdueCount > 0 && (
                  <span 
                    className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                    data-testid="notification-badge"
                  >
                    {overdueCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Notificações de Atrasos</h3>
                  {overdueCount > 0 && (
                    <span className="text-sm text-red-600 font-medium">
                      {overdueCount} {overdueCount === 1 ? 'item atrasado' : 'itens atrasados'}
                    </span>
                  )}
                </div>

                {overdueItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500 text-sm">Nenhum atraso no momento</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {overdueItems.map((item) => {
                        const isRead = readNotifications.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`p-3 border rounded-lg transition-colors relative ${
                              isRead 
                                ? 'bg-slate-50 border-slate-200 opacity-60' 
                                : 'bg-red-50 border-red-200 hover:bg-red-100'
                            }`}
                          >
                            <Link
                              to={`/equipment/${item.id}`}
                              className="block"
                            >
                              <div className="flex justify-between items-start pr-6">
                                <div>
                                  <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                                  <p className="text-xs text-slate-600">{item.borrower_name}</p>
                                </div>
                                <span className="text-xs font-bold text-red-700">
                                  {item.days_overdue} {item.days_overdue === 1 ? 'dia' : 'dias'}
                                </span>
                              </div>
                            </Link>
                            {!isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(item.id);
                                }}
                                className="absolute top-2 right-2 p-1 hover:bg-red-200 rounded-full transition-colors"
                                title="Marcar como lida"
                                data-testid={`mark-read-${item.id}`}
                              >
                                <svg className="h-3 w-3 text-red-700" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {overdueCount > 5 && (
                      <Link
                        to="/?tab=atrasos"
                        className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium pt-2"
                      >
                        Ver todos os {overdueCount} atrasos
                      </Link>
                    )}

                    <div className="pt-3 border-t border-slate-200 flex gap-2">
                      {overdueCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          data-testid="mark-all-read-btn"
                        >
                          Marcar Todas como Lidas
                        </button>
                      )}
                      {readNotifications.length > 0 && (
                        <button
                          onClick={clearReadNotifications}
                          className="flex-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          data-testid="clear-read-btn"
                        >
                          Limpar Lidas
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
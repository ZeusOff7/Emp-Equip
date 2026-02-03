import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, CheckCircle, AlertTriangle, Wrench, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'visao-geral';
  
  const [stats, setStats] = useState(null);
  const [recentMovements, setRecentMovements] = useState([]);
  const [overdueEquipment, setOverdueEquipment] = useState([]);
  const [overdueDetailed, setOverdueDetailed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, movementsRes, overdueRes, overdueDetailedRes] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/movements?limit=10`),
        axios.get(`${API}/movements/overdue`),
        axios.get(`${API}/overdue/detailed`),
      ]);

      setStats(statsRes.data);
      setRecentMovements(movementsRes.data.slice(0, 5));
      setOverdueEquipment(overdueRes.data);
      setOverdueDetailed(overdueDetailedRes.data);
    } catch (error) {
      toast.error('Falha ao carregar dados do painel');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Mock chart data
  const chartData = [
    { name: 'Seg', loans: 4 },
    { name: 'Ter', loans: 6 },
    { name: 'Qua', loans: 8 },
    { name: 'Qui', loans: 5 },
    { name: 'Sex', loans: 9 },
    { name: 'Sáb', loans: 3 },
    { name: 'Dom', loans: 2 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Carregando painel...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total de Equipamentos',
      value: stats?.total_equipment || 0,
      icon: Package,
      color: 'text-slate-900',
      bgColor: 'bg-slate-100',
      testId: 'stat-total',
      filterStatus: 'All'
    },
    {
      title: 'Disponíveis',
      value: stats?.available || 0,
      icon: CheckCircle,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100',
      testId: 'stat-available',
      filterStatus: 'Available'
    },
    {
      title: 'Em Empréstimo',
      value: stats?.on_loan || 0,
      icon: AlertTriangle,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
      testId: 'stat-on-loan',
      filterStatus: 'On Loan'
    },
    {
      title: 'Manutenção',
      value: stats?.maintenance || 0,
      icon: Wrench,
      color: 'text-slate-700',
      bgColor: 'bg-slate-100',
      testId: 'stat-maintenance',
      filterStatus: 'Maintenance'
    },
  ];

  return (
    <div className="p-8 md:p-12" data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Painel de Controle</h1>
        <p className="text-slate-600">Visão geral do gerenciamento de empréstimos</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              to={`/equipment?status=${stat.filterStatus}`}
              data-testid={stat.testId}
            >
              <Card className="stat-card border border-slate-200 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Tabs for Overview and Overdue */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="visao-geral" data-testid="tab-overview">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="atrasos" data-testid="tab-overdue">
            Atrasos {overdueDetailed.length > 0 && `(${overdueDetailed.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="visao-geral" className="space-y-6">
          {/* Overdue Alert */}
          {overdueEquipment.length > 0 && (
            <Card className="border-red-200 bg-red-50" data-testid="overdue-alert">
              <CardHeader>
                <CardTitle className="text-red-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Equipamentos Atrasados ({overdueEquipment.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueEquipment.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      to={`/equipment/${item.id}`}
                      className="block p-3 bg-white rounded-lg hover:bg-red-100 transition-colors"
                      data-testid={`overdue-item-${item.id}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-600">Responsável: {item.current_borrower}</p>
                        </div>
                        <p className="text-sm text-red-700 font-medium">
                          Prazo: {new Date(item.expected_return_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </Link>
                  ))}
                  {overdueEquipment.length > 3 && (
                    <button
                      onClick={() => setActiveTab('atrasos')}
                      className="w-full text-center text-sm text-red-700 hover:text-red-900 font-medium py-2"
                    >
                      Ver todos os {overdueEquipment.length} equipamentos atrasados
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chart and Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart */}
            <Card className="border border-slate-200 rounded-xl" data-testid="loans-chart">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Empréstimos Esta Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="loans"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border border-slate-200 rounded-xl" data-testid="recent-activity">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentMovements.length === 0 ? (
                    <p className="text-slate-500 text-sm">Nenhuma atividade recente</p>
                  ) : (
                    recentMovements.map((movement) => (
                      <div
                        key={movement.id}
                        className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                        data-testid={`activity-${movement.id}`}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            movement.movement_type === 'check_out'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {movement.movement_type === 'check_out' ? '↗' : '↙'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {movement.equipment_name}
                          </p>
                          <p className="text-xs text-slate-600">
                            {movement.movement_type === 'check_out' ? 'Emprestado para' : 'Devolvido por'}{' '}
                            {movement.borrower_name}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(movement.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="atrasos">
          <Card className="border border-slate-200 rounded-xl" data-testid="overdue-tab-content">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Equipamentos com Atraso na Devolução
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueDetailed.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-900">Nenhum atraso no momento!</p>
                  <p className="text-slate-600 mt-2">Todos os equipamentos estão dentro do prazo.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                        <th className="px-4 py-3 text-left">Equipamento</th>
                        <th className="px-4 py-3 text-left">Responsável</th>
                        <th className="px-4 py-3 text-left">E-mail</th>
                        <th className="px-4 py-3 text-left">Prazo de Devolução</th>
                        <th className="px-4 py-3 text-left">Dias em Atraso</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueDetailed.map((item) => (
                        <tr 
                          key={item.id} 
                          className="border-t border-slate-200 hover:bg-slate-50 transition-colors"
                          data-testid={`overdue-row-${item.id}`}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-slate-900">{item.name}</p>
                              <p className="text-xs text-slate-600">{item.model}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-900">{item.borrower_name}</td>
                          <td className="px-4 py-3 text-slate-600 text-sm">{item.borrower_email}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="h-4 w-4" />
                              {new Date(item.expected_return_date).toLocaleDateString('pt-BR')}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800">
                              {item.days_overdue} {item.days_overdue === 1 ? 'dia' : 'dias'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-900">
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link to={`/equipment/${item.id}`}>
                              <button 
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                data-testid={`view-overdue-${item.id}`}
                              >
                                Ver Detalhes
                              </button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

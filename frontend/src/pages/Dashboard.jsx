import { useEffect, useState } from 'react';
import { Package, CheckCircle, AlertTriangle, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentMovements, setRecentMovements] = useState([]);
  const [overdueEquipment, setOverdueEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, movementsRes, overdueRes] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/movements?limit=10`),
        axios.get(`${API}/movements/overdue`),
      ]);

      setStats(statsRes.data);
      setRecentMovements(movementsRes.data.slice(0, 5));
      setOverdueEquipment(overdueRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Mock chart data
  const chartData = [
    { name: 'Mon', loans: 4 },
    { name: 'Tue', loans: 6 },
    { name: 'Wed', loans: 8 },
    { name: 'Thu', loans: 5 },
    { name: 'Fri', loans: 9 },
    { name: 'Sat', loans: 3 },
    { name: 'Sun', loans: 2 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Equipment',
      value: stats?.total_equipment || 0,
      icon: Package,
      color: 'text-slate-900',
      bgColor: 'bg-slate-100',
      testId: 'stat-total'
    },
    {
      title: 'Available',
      value: stats?.available || 0,
      icon: CheckCircle,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100',
      testId: 'stat-available'
    },
    {
      title: 'On Loan',
      value: stats?.on_loan || 0,
      icon: AlertTriangle,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
      testId: 'stat-on-loan'
    },
    {
      title: 'Maintenance',
      value: stats?.maintenance || 0,
      icon: Wrench,
      color: 'text-slate-700',
      bgColor: 'bg-slate-100',
      testId: 'stat-maintenance'
    },
  ];

  return (
    <div className="p-8 md:p-12" data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Equipment loan management overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="stat-card border border-slate-200 rounded-xl" data-testid={stat.testId}>
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
          );
        })}
      </div>

      {/* Overdue Alert */}
      {overdueEquipment.length > 0 && (
        <Card className="border-red-200 bg-red-50 mb-8" data-testid="overdue-alert">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Overdue Equipment ({overdueEquipment.length})
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
                      <p className="text-sm text-slate-600">Borrower: {item.current_borrower}</p>
                    </div>
                    <p className="text-sm text-red-700 font-medium">
                      Due: {new Date(item.expected_return_date).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart and Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart */}
        <Card className="border border-slate-200 rounded-xl" data-testid="loans-chart">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Loans This Week</CardTitle>
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
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMovements.length === 0 ? (
                <p className="text-slate-500 text-sm">No recent activity</p>
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
                        {movement.movement_type === 'check_out' ? 'Checked out to' : 'Returned by'}{' '}
                        {movement.borrower_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(movement.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
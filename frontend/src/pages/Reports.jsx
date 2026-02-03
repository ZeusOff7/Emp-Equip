import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Reports() {
  const [equipment, setEquipment] = useState([]);
  const [movements, setMovements] = useState([]);
  const [overdueEquipment, setOverdueEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('overdue');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [equipRes, movementsRes, overdueRes] = await Promise.all([
        axios.get(`${API}/equipment`),
        axios.get(`${API}/movements`),
        axios.get(`${API}/movements/overdue`),
      ]);

      setEquipment(equipRes.data);
      setMovements(movementsRes.data);
      setOverdueEquipment(overdueRes.data);
    } catch (error) {
      toast.error('Failed to load reports');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportOverdue = () => {
    const data = overdueEquipment.map((item) => ({
      name: item.name,
      model: item.model,
      borrower: item.current_borrower,
      email: item.current_borrower_email || 'N/A',
      expected_return: new Date(item.expected_return_date).toLocaleDateString(),
    }));
    exportToCSV(data, 'overdue-equipment.csv');
    toast.success('Report exported successfully');
  };

  const handleExportAllEquipment = () => {
    const data = equipment.map((item) => ({
      name: item.name,
      model: item.model,
      serial_number: item.serial_number || 'N/A',
      status: item.status,
      current_borrower: item.current_borrower || 'N/A',
    }));
    exportToCSV(data, 'all-equipment.csv');
    toast.success('Report exported successfully');
  };

  const handleExportMovements = () => {
    const data = movements.map((mov) => ({
      equipment: mov.equipment_name,
      type: mov.movement_type,
      borrower: mov.borrower_name,
      email: mov.borrower_email,
      timestamp: new Date(mov.timestamp).toLocaleString(),
    }));
    exportToCSV(data, 'transaction-history.csv');
    toast.success('Report exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading reports...</div>
      </div>
    );
  }

  const onLoanEquipment = equipment.filter((e) => e.status === 'On Loan');
  const availableEquipment = equipment.filter((e) => e.status === 'Available');
  const utilizationRate = equipment.length > 0
    ? ((onLoanEquipment.length / equipment.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="p-8 md:p-12" data-testid="reports-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Reports</h1>
        <p className="text-slate-600">Analytics and insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border border-slate-200 rounded-xl" data-testid="utilization-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                  Utilization Rate
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{utilizationRate}%</p>
                <p className="text-sm text-slate-600 mt-1">
                  {onLoanEquipment.length} of {equipment.length} items on loan
                </p>
              </div>
              <div className="bg-blue-100 text-blue-700 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 rounded-xl" data-testid="overdue-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                  Overdue Items
                </p>
                <p className="text-3xl font-bold text-red-700 mt-2">{overdueEquipment.length}</p>
                <p className="text-sm text-slate-600 mt-1">Require immediate attention</p>
              </div>
              <div className="bg-red-100 text-red-700 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 rounded-xl" data-testid="transactions-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                  Total Transactions
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{movements.length}</p>
                <p className="text-sm text-slate-600 mt-1">All time movements</p>
              </div>
              <div className="bg-slate-100 text-slate-700 p-3 rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Type Selector */}
      <Card className="border border-slate-200 rounded-xl mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-slate-700">Select Report:</p>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-64" data-testid="report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overdue">Overdue Equipment</SelectItem>
                <SelectItem value="current_loans">Current Loans</SelectItem>
                <SelectItem value="available">Available Equipment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {reportType === 'overdue' && (
        <Card className="border border-slate-200 rounded-xl" data-testid="overdue-report">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Overdue Equipment</CardTitle>
            <Button
              onClick={handleExportOverdue}
              variant="outline"
              disabled={overdueEquipment.length === 0}
              data-testid="export-overdue-btn"
            >
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            {overdueEquipment.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No overdue equipment</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                      <th className="px-4 py-3 text-left">Equipment</th>
                      <th className="px-4 py-3 text-left">Model</th>
                      <th className="px-4 py-3 text-left">Borrower</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Due Date</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueEquipment.map((item) => (
                      <tr key={item.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                        <td className="px-4 py-3 text-slate-600">{item.model}</td>
                        <td className="px-4 py-3 text-slate-900">{item.current_borrower}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{item.current_borrower_email || 'N/A'}</td>
                        <td className="px-4 py-3 text-red-700 font-medium">
                          {new Date(item.expected_return_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/equipment/${item.id}`}>
                            <Button variant="outline" size="sm" data-testid={`view-${item.id}`}>
                              View
                            </Button>
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
      )}

      {reportType === 'current_loans' && (
        <Card className="border border-slate-200 rounded-xl" data-testid="loans-report">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Current Loans</CardTitle>
            <Button
              onClick={handleExportAllEquipment}
              variant="outline"
              disabled={onLoanEquipment.length === 0}
              data-testid="export-loans-btn"
            >
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            {onLoanEquipment.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No equipment currently on loan</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                      <th className="px-4 py-3 text-left">Equipment</th>
                      <th className="px-4 py-3 text-left">Model</th>
                      <th className="px-4 py-3 text-left">Borrower</th>
                      <th className="px-4 py-3 text-left">Delivery</th>
                      <th className="px-4 py-3 text-left">Expected Return</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onLoanEquipment.map((item) => (
                      <tr key={item.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                        <td className="px-4 py-3 text-slate-600">{item.model}</td>
                        <td className="px-4 py-3 text-slate-900">{item.current_borrower}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.delivery_date ? new Date(item.delivery_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.expected_return_date ? new Date(item.expected_return_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/equipment/${item.id}`}>
                            <Button variant="outline" size="sm" data-testid={`view-${item.id}`}>
                              View
                            </Button>
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
      )}

      {reportType === 'available' && (
        <Card className="border border-slate-200 rounded-xl" data-testid="available-report">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Available Equipment</CardTitle>
            <Button
              onClick={handleExportAllEquipment}
              variant="outline"
              disabled={availableEquipment.length === 0}
              data-testid="export-available-btn"
            >
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            {availableEquipment.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No available equipment</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                      <th className="px-4 py-3 text-left">Equipment</th>
                      <th className="px-4 py-3 text-left">Model</th>
                      <th className="px-4 py-3 text-left">Serial Number</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableEquipment.map((item) => (
                      <tr key={item.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                        <td className="px-4 py-3 text-slate-600">{item.model}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-sm">
                          {item.serial_number || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-900">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/equipment/${item.id}`}>
                            <Button variant="outline" size="sm" data-testid={`view-${item.id}`}>
                              View
                            </Button>
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
      )}

      {/* Export All Options */}
      <Card className="border border-slate-200 rounded-xl mt-8" data-testid="export-all-card">
        <CardHeader>
          <CardTitle>Export All Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleExportAllEquipment}
              variant="outline"
              data-testid="export-all-equipment-btn"
            >
              Export All Equipment
            </Button>
            <Button
              onClick={handleExportMovements}
              variant="outline"
              data-testid="export-all-movements-btn"
            >
              Export Transaction History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
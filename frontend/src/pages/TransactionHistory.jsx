import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TransactionHistory() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter !== 'All') params.movement_type = typeFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axios.get(`${API}/movements`, { params });
      setMovements(response.data);
    } catch (error) {
      toast.error('Failed to load transaction history');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchMovements();
  };

  return (
    <div className="p-8 md:p-12" data-testid="transaction-history-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Transaction History</h1>
        <p className="text-slate-600">View all equipment movements</p>
      </div>

      {/* Filters */}
      <Card className="border border-slate-200 rounded-xl mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger data-testid="type-filter">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Transactions</SelectItem>
                <SelectItem value="check_out">Check Out</SelectItem>
                <SelectItem value="check_in">Check In</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
              data-testid="start-date"
            />

            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
              data-testid="end-date"
            />

            <Button onClick={handleFilter} className="bg-slate-900 hover:bg-slate-800" data-testid="apply-filter-btn">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading transactions...</div>
        </div>
      ) : movements.length === 0 ? (
        <Card className="border border-slate-200 rounded-xl">
          <CardContent className="p-12 text-center">
            <p className="text-slate-500">No transactions found</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-slate-200 rounded-xl">
          <CardHeader>
            <CardTitle>All Transactions ({movements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors table-row"
                  data-testid={`transaction-${movement.id}`}
                >
                  <div
                    className={`p-3 rounded-lg ${
                      movement.movement_type === 'check_out'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {movement.movement_type === 'check_out' ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{movement.equipment_name}</h3>
                        <p className="text-sm text-slate-600">
                          {movement.movement_type === 'check_out' ? 'Checked out to' : 'Returned by'}{' '}
                          <span className="font-medium">{movement.borrower_name}</span>
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          movement.movement_type === 'check_out'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {movement.movement_type === 'check_out' ? 'Check Out' : 'Check In'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(movement.timestamp).toLocaleString()}
                      </div>
                      {movement.borrower_email && (
                        <div>Email: {movement.borrower_email}</div>
                      )}
                    </div>

                    {movement.delivery_date && (
                      <div className="mt-2 text-sm text-slate-600">
                        Delivery: {new Date(movement.delivery_date).toLocaleDateString()}
                      </div>
                    )}

                    {movement.expected_return_date && (
                      <div className="text-sm text-slate-600">
                        Expected Return: {new Date(movement.expected_return_date).toLocaleDateString()}
                      </div>
                    )}

                    {movement.notes && (
                      <div className="mt-2 p-3 bg-slate-50 rounded text-sm text-slate-700 italic">
                        {movement.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
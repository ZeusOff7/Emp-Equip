import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_MAP = {
  'Available': 'Disponível',
  'On Loan': 'Em Empréstimo',
  'Maintenance': 'Manutenção',
  'Retired': 'Desativado'
};

export default function EquipmentList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    // Read status from URL parameters
    const urlStatus = searchParams.get('status');
    if (urlStatus && urlStatus !== 'All') {
      setStatusFilter(urlStatus);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchEquipment();
  }, [statusFilter]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      
      const response = await axios.get(`${API}/equipment`, { params });
      setEquipment(response.data);
    } catch (error) {
      toast.error('Falha ao carregar equipamentos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      fetchEquipment();
      return;
    }

    try {
      setLoading(true);
      const params = { search: search.trim() };
      if (statusFilter !== 'All') params.status = statusFilter;
      
      const response = await axios.get(`${API}/equipment`, { params });
      setEquipment(response.data);
    } catch (error) {
      toast.error('Falha na busca');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
    // Update URL parameters
    if (newStatus === 'All') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', newStatus);
    }
    setSearchParams(searchParams);
  };

  const getStatusBadge = (status) => {
    const styles = {
      Available: 'bg-emerald-100 text-emerald-900',
      'On Loan': 'bg-amber-100 text-amber-900',
      Maintenance: 'bg-slate-100 text-slate-800',
      Retired: 'bg-red-100 text-red-900',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium status-badge ${styles[status] || 'bg-slate-100 text-slate-800'}`}>
        {STATUS_MAP[status] || status}
      </span>
    );
  };

  const filteredEquipment = equipment;

  return (
    <div className="p-8 md:p-12" data-testid="equipment-list-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Equipamentos</h1>
        <p className="text-slate-600">
          {statusFilter !== 'All' 
            ? `Filtrando por: ${STATUS_MAP[statusFilter] || statusFilter}`
            : 'Gerenciar todos os itens de equipamento'
          }
        </p>
      </div>

      {/* Filters */}
      <Card className="border border-slate-200 rounded-xl mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Buscar por nome, modelo ou número de série..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
                data-testid="search-input"
              />
              <Button
                onClick={handleSearch}
                className="bg-slate-900 hover:bg-slate-800"
                data-testid="search-btn"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full md:w-48" data-testid="status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Todos os Status</SelectItem>
                <SelectItem value="Available">Disponível</SelectItem>
                <SelectItem value="On Loan">Em Empréstimo</SelectItem>
                <SelectItem value="Maintenance">Manutenção</SelectItem>
                <SelectItem value="Retired">Desativado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Carregando equipamentos...</div>
        </div>
      ) : filteredEquipment.length === 0 ? (
        <Card className="border border-slate-200 rounded-xl">
          <CardContent className="p-12 text-center">
            <p className="text-slate-500">Nenhum equipamento encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => (
            <Link
              key={item.id}
              to={`/equipment/${item.id}`}
              data-testid={`equipment-card-${item.id}`}
            >
              <Card className="stat-card border border-slate-200 rounded-xl hover:shadow-md transition-all duration-200 h-full">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-slate-600">{item.model}</p>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {item.serial_number && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                        Número de Série
                      </p>
                      <p className="text-sm font-mono text-slate-900">{item.serial_number}</p>
                    </div>
                  )}

                  {item.status === 'On Loan' && item.current_borrower && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                        Responsável Atual
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {item.current_borrower}
                      </p>
                      {item.expected_return_date && (
                        <p className="text-xs text-slate-600 mt-1">
                          Prazo: {new Date(item.expected_return_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
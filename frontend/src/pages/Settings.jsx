import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Save, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkInterval, setCheckInterval] = useState('1');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/settings`);
      setCheckInterval(String(response.data.check_interval_hours || 1));
    } catch (error) {
      toast.error('Falha ao carregar configurações');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.put(`${API}/settings`, {
        check_interval_hours: parseInt(checkInterval)
      });
      toast.success('Configurações salvas com sucesso');
      
      // Reload page to apply new interval
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error('Falha ao salvar configurações');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const intervalOptions = [
    { value: '0.25', label: 'A cada 15 minutos' },
    { value: '0.5', label: 'A cada 30 minutos' },
    { value: '1', label: 'A cada hora' },
    { value: '2', label: 'A cada 2 horas' },
    { value: '3', label: 'A cada 3 horas' },
    { value: '6', label: 'A cada 6 horas' },
    { value: '12', label: 'A cada 12 horas' },
    { value: '24', label: 'Uma vez por dia' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12" data-testid="settings-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Configurações</h1>
        <p className="text-slate-600">Gerencie as preferências do sistema</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Notification Settings */}
        <Card className="border border-slate-200 rounded-xl" data-testid="notification-settings">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Notificações de Atrasos</CardTitle>
                <CardDescription className="mt-1">
                  Configure com que frequência o sistema verifica equipamentos atrasados
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="check-interval" className="text-sm font-medium text-slate-700">
                Frequência de Verificação
              </Label>
              <Select value={checkInterval} onValueChange={setCheckInterval}>
                <SelectTrigger id="check-interval" data-testid="interval-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {intervalOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-600">
                O sistema verificará automaticamente os atrasos no intervalo selecionado e atualizará o badge de notificações.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <RefreshCw className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Como Funciona</p>
                  <p className="text-sm text-blue-800 mt-1">
                    O sistema fará verificações automáticas em segundo plano. Você receberá notificações visuais no ícone de sino quando houver equipamentos atrasados. Não há envio de e-mails ou SMS.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-slate-900 hover:bg-slate-800"
                data-testid="save-settings-btn"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border border-slate-200 rounded-xl bg-slate-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Informações Adicionais</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>As notificações são apenas visuais e aparecem no ícone de sino no canto superior direito</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>O badge mostra o número total de equipamentos atrasados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Clique no sino para ver uma lista rápida dos itens atrasados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>A aba "Atrasos" no painel mostra todos os detalhes, incluindo dias em atraso</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Alterações na frequência de verificação entrarão em vigor após salvar</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
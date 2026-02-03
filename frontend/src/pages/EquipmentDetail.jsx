import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Upload, Download, FileText, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

export default function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [movements, setMovements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [checkoutForm, setCheckoutForm] = useState({
    borrower_name: '',
    borrower_email: '',
    delivery_date: '',
    expected_return_date: '',
    notes: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    model: '',
    serial_number: '',
    status: '',
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [equipRes, movementsRes, docsRes] = await Promise.all([
        axios.get(`${API}/equipment/${id}`),
        axios.get(`${API}/movements?equipment_id=${id}`),
        axios.get(`${API}/documents/equipment/${id}`),
      ]);

      setEquipment(equipRes.data);
      setMovements(movementsRes.data);
      setDocuments(docsRes.data);
      
      setEditForm({
        name: equipRes.data.name,
        model: equipRes.data.model,
        serial_number: equipRes.data.serial_number || '',
        status: equipRes.data.status,
      });
    } catch (error) {
      toast.error('Falha ao carregar detalhes do equipamento');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!checkoutForm.borrower_name || !checkoutForm.borrower_email) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      await axios.post(`${API}/movements`, {
        equipment_id: id,
        movement_type: 'check_out',
        ...checkoutForm,
      });

      toast.success('Equipamento emprestado com sucesso');
      setShowCheckoutDialog(false);
      setCheckoutForm({
        borrower_name: '',
        borrower_email: '',
        delivery_date: '',
        expected_return_date: '',
        notes: '',
      });
      fetchData();
    } catch (error) {
      toast.error('Falha ao emprestar equipamento');
      console.error(error);
    }
  };

  const handleCheckin = async () => {
    if (!equipment.current_borrower) {
      toast.error('Nenhum empréstimo ativo para este equipamento');
      return;
    }

    try {
      await axios.post(`${API}/movements`, {
        equipment_id: id,
        movement_type: 'check_in',
        borrower_name: equipment.current_borrower,
        borrower_email: equipment.current_borrower_email || 'N/A',
      });

      toast.success('Equipamento devolvido com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Falha ao devolver equipamento');
      console.error(error);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`${API}/equipment/${id}`, editForm);
      toast.success('Equipamento atualizado com sucesso');
      setShowEditDialog(false);
      fetchData();
    } catch (error) {
      toast.error('Falha ao atualizar equipamento');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este equipamento?')) {
      return;
    }

    try {
      await axios.delete(`${API}/equipment/${id}`);
      toast.success('Equipamento excluído com sucesso');
      navigate('/equipment');
    } catch (error) {
      toast.error('Falha ao excluir equipamento');
      console.error(error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      toast.error('Apenas arquivos PDF são permitidos');
      return;
    }

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('equipment_id', id);

      await axios.post(`${API}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Documento enviado com sucesso');
      fetchData();
      e.target.value = '';
    } catch (error) {
      toast.error('Falha ao enviar documento');
      console.error(error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDownloadDocument = async (docId, filename) => {
    try {
      const response = await axios.get(`${API}/documents/${docId}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Falha ao baixar documento');
      console.error(error);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }

    try {
      await axios.delete(`${API}/documents/${docId}`);
      toast.success('Documento excluído com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Falha ao excluir documento');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Carregando detalhes do equipamento...</div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Equipamento não encontrado</div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const styles = {
      Available: 'bg-emerald-100 text-emerald-900',
      'On Loan': 'bg-amber-100 text-amber-900',
      Maintenance: 'bg-slate-100 text-slate-800',
      Retired: 'bg-red-100 text-red-900',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {STATUS_MAP[status] || status}
      </span>
    );
  };

  return (
    <div className="p-8 md:p-12" data-testid="equipment-detail-page">
      <div className="mb-8">
        <Link
          to="/equipment"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          data-testid="back-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Equipamentos
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{equipment.name}</h1>
            <p className="text-slate-600">{equipment.model}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="edit-btn">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Equipamento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEdit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Equipamento</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                      data-testid="edit-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input
                      value={editForm.model}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      required
                      data-testid="edit-model"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número de Série</Label>
                    <Input
                      value={editForm.serial_number}
                      onChange={(e) => setEditForm({ ...editForm, serial_number: e.target.value })}
                      className="font-mono"
                      data-testid="edit-serial"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                      <SelectTrigger data-testid="edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Disponível</SelectItem>
                        <SelectItem value="On Loan">Em Empréstimo</SelectItem>
                        <SelectItem value="Maintenance">Manutenção</SelectItem>
                        <SelectItem value="Retired">Desativado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="save-edit-btn">
                      Salvar Alterações
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="destructive" onClick={handleDelete} data-testid="delete-btn">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 rounded-xl">
            <CardHeader>
              <CardTitle>Informações do Equipamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
                  {getStatusBadge(equipment.status)}
                </div>
                {equipment.serial_number && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Número de Série</p>
                    <p className="text-sm font-mono text-slate-900">{equipment.serial_number}</p>
                  </div>
                )}
              </div>

              {equipment.status === 'On Loan' && equipment.current_borrower && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Empréstimo Atual</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-slate-600">Responsável</p>
                      <p className="text-base font-medium text-slate-900">{equipment.current_borrower}</p>
                    </div>
                    {equipment.current_borrower_email && (
                      <div>
                        <p className="text-sm text-slate-600">E-mail</p>
                        <p className="text-base text-slate-900">{equipment.current_borrower_email}</p>
                      </div>
                    )}
                    {equipment.delivery_date && (
                      <div>
                        <p className="text-sm text-slate-600">Data de Entrega</p>
                        <p className="text-base text-slate-900">
                          {new Date(equipment.delivery_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {equipment.expected_return_date && (
                      <div>
                        <p className="text-sm text-slate-600">Prazo de Devolução</p>
                        <p className="text-base text-slate-900">
                          {new Date(equipment.expected_return_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border border-slate-200 rounded-xl">
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              {equipment.status === 'Available' || equipment.status === 'Maintenance' ? (
                <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-slate-900 hover:bg-slate-800" data-testid="checkout-btn">
                      Emprestar Equipamento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Emprestar Equipamento</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCheckout} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome do Responsável *</Label>
                        <Input
                          value={checkoutForm.borrower_name}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, borrower_name: e.target.value })}
                          required
                          data-testid="checkout-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>E-mail do Responsável *</Label>
                        <Input
                          type="email"
                          value={checkoutForm.borrower_email}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, borrower_email: e.target.value })}
                          required
                          data-testid="checkout-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data de Entrega</Label>
                        <Input
                          type="date"
                          value={checkoutForm.delivery_date}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, delivery_date: e.target.value })}
                          data-testid="checkout-delivery"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Prazo de Devolução</Label>
                        <Input
                          type="date"
                          value={checkoutForm.expected_return_date}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, expected_return_date: e.target.value })}
                          data-testid="checkout-return"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                          value={checkoutForm.notes}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                          placeholder="Observações opcionais..."
                          data-testid="checkout-notes"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="confirm-checkout-btn">
                          Confirmar Empréstimo
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowCheckoutDialog(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              ) : equipment.status === 'On Loan' ? (
                <Button onClick={handleCheckin} className="bg-emerald-600 hover:bg-emerald-700" data-testid="checkin-btn">
                  Devolver Equipamento
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {/* History */}
          <Card className="border border-slate-200 rounded-xl">
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhum histórico de movimentação</p>
              ) : (
                <div className="space-y-3">
                  {movements.map((movement) => (
                    <div
                      key={movement.id}
                      className="flex gap-3 p-3 border border-slate-200 rounded-lg"
                      data-testid={`movement-${movement.id}`}
                    >
                      <div
                        className={`p-2 rounded-lg h-fit ${
                          movement.movement_type === 'check_out'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {movement.movement_type === 'check_out' ? '↗' : '↙'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {movement.movement_type === 'check_out' ? 'Emprestado' : 'Devolvido'}
                        </p>
                        <p className="text-sm text-slate-600">Responsável: {movement.borrower_name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(movement.timestamp).toLocaleString('pt-BR')}
                        </p>
                        {movement.notes && (
                          <p className="text-sm text-slate-600 mt-2 italic">{movement.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Documents Sidebar */}
        <div>
          <Card className="border border-slate-200 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Documentos
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <Upload className="h-4 w-4" />
                  </div>
                </Label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFile}
                  data-testid="file-upload"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {uploadingFile && <p className="text-sm text-slate-500 mb-3">Enviando...</p>}
              {documents.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhum documento enviado</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      data-testid={`document-${doc.id}`}
                    >
                      <FileText className="h-4 w-4 text-slate-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {doc.original_filename}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(doc.file_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDownloadDocument(doc.id, doc.original_filename)}
                          className="p-1 hover:bg-slate-100 rounded"
                          data-testid={`download-doc-${doc.id}`}
                        >
                          <Download className="h-4 w-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1 hover:bg-red-100 rounded"
                          data-testid={`delete-doc-${doc.id}`}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

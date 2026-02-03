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
      toast.error('Failed to load equipment details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!checkoutForm.borrower_name || !checkoutForm.borrower_email) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await axios.post(`${API}/movements`, {
        equipment_id: id,
        movement_type: 'check_out',
        ...checkoutForm,
      });

      toast.success('Equipment checked out successfully');
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
      toast.error('Failed to check out equipment');
      console.error(error);
    }
  };

  const handleCheckin = async () => {
    if (!equipment.current_borrower) {
      toast.error('No active loan for this equipment');
      return;
    }

    try {
      await axios.post(`${API}/movements`, {
        equipment_id: id,
        movement_type: 'check_in',
        borrower_name: equipment.current_borrower,
        borrower_email: equipment.current_borrower_email || 'N/A',
      });

      toast.success('Equipment checked in successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to check in equipment');
      console.error(error);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`${API}/equipment/${id}`, editForm);
      toast.success('Equipment updated successfully');
      setShowEditDialog(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update equipment');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) {
      return;
    }

    try {
      await axios.delete(`${API}/equipment/${id}`);
      toast.success('Equipment deleted successfully');
      navigate('/equipment');
    } catch (error) {
      toast.error('Failed to delete equipment');
      console.error(error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      toast.error('Only PDF files are allowed');
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

      toast.success('Document uploaded successfully');
      fetchData();
      e.target.value = '';
    } catch (error) {
      toast.error('Failed to upload document');
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
      toast.error('Failed to download document');
      console.error(error);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await axios.delete(`${API}/documents/${docId}`);
      toast.success('Document deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete document');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading equipment details...</div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Equipment not found</div>
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
        {status}
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
          Back to Equipment
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
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Equipment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEdit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Equipment Name</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                      data-testid="edit-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input
                      value={editForm.model}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      required
                      data-testid="edit-model"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Serial Number</Label>
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
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="On Loan">On Loan</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="save-edit-btn">
                      Save Changes
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="destructive" onClick={handleDelete} data-testid="delete-btn">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 rounded-xl">
            <CardHeader>
              <CardTitle>Equipment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
                  {getStatusBadge(equipment.status)}
                </div>
                {equipment.serial_number && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Serial Number</p>
                    <p className="text-sm font-mono text-slate-900">{equipment.serial_number}</p>
                  </div>
                )}
              </div>

              {equipment.status === 'On Loan' && equipment.current_borrower && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Current Loan</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-slate-600">Borrower</p>
                      <p className="text-base font-medium text-slate-900">{equipment.current_borrower}</p>
                    </div>
                    {equipment.current_borrower_email && (
                      <div>
                        <p className="text-sm text-slate-600">Email</p>
                        <p className="text-base text-slate-900">{equipment.current_borrower_email}</p>
                      </div>
                    )}
                    {equipment.delivery_date && (
                      <div>
                        <p className="text-sm text-slate-600">Delivery Date</p>
                        <p className="text-base text-slate-900">
                          {new Date(equipment.delivery_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {equipment.expected_return_date && (
                      <div>
                        <p className="text-sm text-slate-600">Expected Return</p>
                        <p className="text-base text-slate-900">
                          {new Date(equipment.expected_return_date).toLocaleDateString()}
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
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              {equipment.status === 'Available' || equipment.status === 'Maintenance' ? (
                <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-slate-900 hover:bg-slate-800" data-testid="checkout-btn">
                      Check Out Equipment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Check Out Equipment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCheckout} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Borrower Name *</Label>
                        <Input
                          value={checkoutForm.borrower_name}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, borrower_name: e.target.value })}
                          required
                          data-testid="checkout-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Borrower Email *</Label>
                        <Input
                          type="email"
                          value={checkoutForm.borrower_email}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, borrower_email: e.target.value })}
                          required
                          data-testid="checkout-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Delivery Date</Label>
                        <Input
                          type="date"
                          value={checkoutForm.delivery_date}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, delivery_date: e.target.value })}
                          data-testid="checkout-delivery"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Expected Return Date</Label>
                        <Input
                          type="date"
                          value={checkoutForm.expected_return_date}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, expected_return_date: e.target.value })}
                          data-testid="checkout-return"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={checkoutForm.notes}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                          placeholder="Optional notes..."
                          data-testid="checkout-notes"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="confirm-checkout-btn">
                          Confirm Check Out
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowCheckoutDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              ) : equipment.status === 'On Loan' ? (
                <Button onClick={handleCheckin} className="bg-emerald-600 hover:bg-emerald-700" data-testid="checkin-btn">
                  Check In Equipment
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {/* History */}
          <Card className="border border-slate-200 rounded-xl">
            <CardHeader>
              <CardTitle>Movement History</CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-slate-500 text-sm">No movement history</p>
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
                          {movement.movement_type === 'check_out' ? 'Checked Out' : 'Checked In'}
                        </p>
                        <p className="text-sm text-slate-600">Borrower: {movement.borrower_name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(movement.timestamp).toLocaleString()}
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
                Documents
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
              {uploadingFile && <p className="text-sm text-slate-500 mb-3">Uploading...</p>}
              {documents.length === 0 ? (
                <p className="text-slate-500 text-sm">No documents uploaded</p>
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
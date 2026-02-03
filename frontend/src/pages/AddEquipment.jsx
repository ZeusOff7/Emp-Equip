import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AddEquipment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serial_number: '',
    status: 'Available',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.model) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API}/equipment`, formData);
      toast.success('Equipment added successfully');
      navigate('/equipment');
    } catch (error) {
      toast.error('Failed to add equipment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-8 md:p-12" data-testid="add-equipment-page">
      <div className="mb-8">
        <Link
          to="/equipment"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          data-testid="back-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Equipment
        </Link>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Add New Equipment</h1>
        <p className="text-slate-600">Register a new equipment item</p>
      </div>

      <Card className="border border-slate-200 rounded-xl max-w-2xl">
        <CardHeader>
          <CardTitle>Equipment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                  Equipment Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., MacBook Pro 16"
                  required
                  data-testid="input-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="text-sm font-medium text-slate-700">
                  Model *
                </Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="e.g., 2023 M2 Pro"
                  required
                  data-testid="input-model"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial_number" className="text-sm font-medium text-slate-700">
                  Serial Number
                </Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => handleChange('serial_number', e.target.value)}
                  placeholder="e.g., SN123456789"
                  className="font-mono"
                  data-testid="input-serial"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-slate-700">
                  Initial Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger id="status" data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-slate-900 hover:bg-slate-800 text-white"
                data-testid="submit-btn"
              >
                {loading ? 'Adding...' : 'Add Equipment'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/equipment')}
                data-testid="cancel-btn"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
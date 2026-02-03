import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import EquipmentList from '@/pages/EquipmentList';
import EquipmentDetail from '@/pages/EquipmentDetail';
import AddEquipment from '@/pages/AddEquipment';
import TransactionHistory from '@/pages/TransactionHistory';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import '@/App.css';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/equipment" element={<EquipmentList />} />
          <Route path="/equipment/new" element={<AddEquipment />} />
          <Route path="/equipment/:id" element={<EquipmentDetail />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
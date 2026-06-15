import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiClient } from '../../api/client';
import CustomerListColumn from './components/CustomerListColumn';
import ActivityCenterColumn from './components/ActivityCenterColumn';

export default function CustomersView() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncTimestamp, setSyncTimestamp] = useState(() => Date.now());
  const [toast, setToast] = useState({ visible: false, type: 'success', message: '' });
  const toastTimer = useRef(null);

  const showToast = (type, message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, type, message });
    toastTimer.current = setTimeout(() => {
      setToast({ visible: false, type: 'success', message: '' });
    }, 3000);
  };

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const refreshCustomers = async () => {
    try {
      const data = await apiClient.request('customers');
      const list = Array.isArray(data) ? data : [];
      setCustomers(list);
      if (selectedCustomer) {
        const updated = list.find(c => String(c.id) === String(selectedCustomer.id));
        if (updated) setSelectedCustomer(updated);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  useEffect(() => {
    refreshCustomers().finally(() => setLoading(false));
  }, [syncTimestamp]);

  const filteredCustomers = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(c =>
      (c.first_name || '').toLowerCase().includes(q) ||
      (c.last_name  || '').toLowerCase().includes(q) ||
      (c.email      || '').toLowerCase().includes(q) ||
      (c.phone      || '').toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const handleSaveCustomer = async (formData) => {
    const isEdit = !!formData.id;
    const url = isEdit ? `customers/${formData.id}` : 'customers';
    try {
      await apiClient.request(url, { method: 'POST', body: JSON.stringify(formData) });
      showToast('success', isEdit ? 'Customer updated.' : 'Customer added.');
      setSyncTimestamp(Date.now());
    } catch (err) {
      showToast('error', `Save failed: ${err.message}`);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Permanently delete this customer? This cannot be undone.')) return;
    try {
      await apiClient.request(`customers/${id}`, { method: 'DELETE' });
      showToast('success', 'Customer deleted.');
      setSelectedCustomer(null);
      setSyncTimestamp(Date.now());
    } catch (err) {
      showToast('error', `Delete failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 font-sans pr-6">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="w-full font-sans text-left text-slate-900 py-6 pr-6 flex flex-col gap-6 relative min-h-screen animate-fade-in">

      <header className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Customers</h1>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 bg-white rounded-lg outline-none w-64 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder-slate-400"
        />
      </header>

      <div className="w-full overflow-x-auto scrollbar-thin rounded-xl border border-slate-200 bg-white shadow-xs flex select-none min-h-[500px]">
        <CustomerListColumn
          customers={filteredCustomers}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          onSaveCustomer={handleSaveCustomer}
        />
        <ActivityCenterColumn
          customer={selectedCustomer}
          appointments={selectedCustomer?.appointments || []}
          onDeleteCustomer={handleDeleteCustomer}
          onSaveCustomer={handleSaveCustomer}
        />
      </div>

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 border rounded-xl shadow-xl flex items-center gap-3 transition-all duration-300 transform font-sans
        ${toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}
        ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}
      >
        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black
          ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.type === 'success' ? '✓' : '✕'}
        </div>
        <span className="text-xs font-bold tracking-tight select-none">{toast.message}</span>
      </div>

    </div>
  );
}
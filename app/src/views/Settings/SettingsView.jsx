import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import SettingsNavColumn from './components/SettingsNavColumn';
import ProfileFormPane from './components/ProfileFormPane';

export default function SettingsView() {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('profile'); // profile | operational | security
  
  // Storage dictionary states initialized to your new backend fallback definitions [INDEX]
  const [settingsData, setSettingsData] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
    currency_symbol: '$',
    default_appointment_status: 'pending',
    global_buffer_before: 0,
    global_buffer_after: 0,
    api_secret_token: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [syncTimestamp, setSyncTimestamp] = useState(() => Date.now());

  // Pristine Toast States replacing generic browser alert() locks
  const [toast, setToast] = useState({ isVisible: false, type: 'success', message: '' });

  const showToastNotification = (type, message) => {
    setToast({ isVisible: true, type, message });
    setTimeout(() => setToast({ isVisible: false, type: 'success', message: '' }), 3000);
  };

  // Ingest configuration data from your new serialized options endpoint route [INDEX]
  useEffect(() => {
    setLoading(true);
    apiClient.request('settings')
      .then(res => {
        if (res && !Array.isArray(res)) {
          setSettingsData(res);
        }
      })
      .catch(err => console.error("Configuration ingestion failed:", err))
      .finally(() => setLoading(false));
  }, [syncTimestamp]);

  const handleUpdateFieldSetting = (fieldKey, value) => {
    setSettingsData(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleSaveGlobalConfiguration = async (e) => {
    if (e) e.preventDefault();
    try {
      setSubmitting(true);
      await apiClient.request('settings', {
        method: 'POST',
        body: JSON.stringify(settingsData)
      });
      showToastNotification('success', 'Global business options synchronized successfully.');
      setSyncTimestamp(Date.now());
    } catch (err) {
      showToastNotification('error', `Configuration blocked: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 font-sans text-left pr-6">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading administrative configuration parameters...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans text-left text-slate-900 py-6 pr-6 animate-fade-in flex flex-col relative min-h-screen">
      <header className="border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Business Settings</h1>
      </header>

      {/* 🔮 CASCADING SETTINGS DECK WORKSPACE CONTAINER */}
      <div className="w-full overflow-x-auto scrollbar-thin rounded-xl border border-slate-200 bg-white shadow-xs flex select-none min-h-125">
        <SettingsNavColumn 
          activeSection={activeSection} 
          onSelectSection={setActiveSection} 
        />
        <ProfileFormPane 
          activeSection={activeSection}
          settingsData={settingsData}
          onUpdateField={handleUpdateFieldSetting}
          onSave={handleSaveGlobalConfiguration}
          submitting={submitting}
        />
      </div>

      {/* FLOATING STATUS TOAST SHEET */}
      <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 border rounded-xl shadow-xl flex items-center gap-3 transition-all duration-300 transform font-sans ${toast.isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'} ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
        <div className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[10px] font-black ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.type === 'success' ? '✓' : '✕'}
        </div>
        <span className="text-xs font-bold tracking-tight select-none">{toast.message}</span>
      </div>
    </div>
  );
}

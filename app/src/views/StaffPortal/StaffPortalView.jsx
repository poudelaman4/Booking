import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../api/client';
import AppointmentRowItem from './components/AppointmentRowItem';
import AppointmentModal from '../Calendar/components/AppointmentModal';

const FILTERS = [
  { key: 'upcoming', label: 'Upcoming Shifts' },
  { key: 'pending',  label: 'Awaiting Action' },
  { key: 'all',      label: 'All History' },
];

export default function StaffPortalView() {
  const [loading, setLoading]         = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [isAllTime, setIsAllTime]       = useState(true);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  
  const [inspectedRecord, setInspectedRecord] = useState(null);

  const contextSource   = window.igniteStaffContext || window.igniteBookings || {};
  const staffEmployeeId = contextSource.employee_id || null;
  const staffName       = contextSource.display_name || 'Staff Portal';

  const loadAppointments = async () => {
    try {
      const data = await apiClient.request(
        staffEmployeeId ? `staff-portal/appointments?employee_id=${staffEmployeeId}` : 'staff-portal/appointments'
      );
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed loading staff portal appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAppointments(); }, [staffEmployeeId]);

  const handleInlineStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await apiClient.request(`staff-portal/appointments/${appointmentId}`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      });
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a));
    } catch (err) {
      alert(`Status transition failed: ${err.message}`);
    }
  };

  const filteredAppointments = useMemo(() => {
    const dateMatched = isAllTime 
      ? appointments 
      : appointments.filter(a => (a.start_time || '').startsWith(selectedDate));

    const sorted = [...dateMatched].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

    const today = new Date();
    const todayCompareStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} 00:00:00`;

    if (activeFilter === 'upcoming') {
      return sorted.filter(a => {
        if (a.status === 'cancelled' || a.status === 'completed') return false;
        return (a.start_time || '') >= todayCompareStr;
      });
    }
    if (activeFilter === 'pending') {
      return sorted.filter(a => a.status === 'pending');
    }
    return sorted;
  }, [appointments, activeFilter, selectedDate, isAllTime]);

  const stats = useMemo(() => ({
    pendingCount: appointments.filter(a => a.status === 'pending').length,
  }), [appointments]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 font-sans text-left pr-6">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading workspace ledger parameters...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-7 font-sans text-left text-slate-900 py-6 pr-6 animate-fade-in select-none">
      
      {/* MINIMALIST FLEX PORTAL HEADER HUB */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none font-sans">
            {staffName}
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-wider pl-0.5">
            Personal Roster Ledger Console
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsAllTime(!isAllTime)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-200 cursor-pointer outline-none h-8.5 flex items-center justify-center font-sans shadow-3xs bg-white text-slate-600 border-slate-200 hover:text-slate-800 hover:border-slate-300 active:scale-[0.99] ${
              isAllTime ? 'bg-slate-100/80 border-slate-300 text-slate-900 font-black shadow-inner' : ''
            }`}
          >
            <span>{isAllTime ? '🗓️ Show Daily Grid' : '📁 View All History'}</span>
          </button>

          {!isAllTime && (
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 h-8.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 hover:border-slate-300 transition-all cursor-pointer shadow-3xs"
            />
          )}
        </div>
      </header>

      {/* TEXT UNDERLINE TAB HIGHLIGHTERS */}
      <div className="flex items-center gap-6 border-b border-slate-100 w-full justify-start pb-0.5">
        {FILTERS.map(f => {
          const isActive = activeFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              className={`group relative pb-2.5 text-[11px] font-black uppercase tracking-widest transition-all outline-none flex items-center gap-2 cursor-pointer bg-transparent border-none
                ${isActive ? 'text-slate-900 font-black' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span>{f.label}</span>
              {f.key === 'pending' && stats.pendingCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[8px] font-black shadow-3xs animate-pulse">
                  {stats.pendingCount}
                </span>
              )}
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 transition-transform duration-200 origin-left
                ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'}`} 
              />
            </button>
          );
        })}
      </div>

      {/* SOLID TEXTURED CONTENT CONTAINER COMPLIANT WITH TAILWIND V4 MATRIX */}
      <div className="bg-white border border-slate-200/70 rounded-xl transition-colors duration-300 ease-out overflow-hidden shadow-xs">
        <div className="w-full overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest select-none">
                <th className="py-3 px-5 text-left">Time Frame</th>
                <th className="py-3 px-5 text-left">Execution Date</th>
                <th className="py-3 px-5 text-left">Service Offerings</th>
                <th className="py-3 px-5 text-left">Assigned Client</th>
                <th className="py-3 px-5 text-right">Settlement Price</th>
                <th className="py-3 px-5 text-right">Roster Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/10">
                    No active appointment entries found within this scope context.
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-xs font-bold text-slate-300 uppercase tracking-wider bg-slate-50/10">
                    No matching sessions open inside this filter tab.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map(appt => (
                  <AppointmentRowItem 
                    key={appt.id} 
                    appointment={appt} 
                    onStatusChange={handleInlineStatusUpdate} 
                    onInspect={setInspectedRecord}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integrated Appointment Details Modal */}
      {inspectedRecord && (
        <AppointmentModal 
          activeModal={inspectedRecord} 
          onClose={() => setInspectedRecord(null)} 
        />
      )}

    </div>
  );
}

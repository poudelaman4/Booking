import React from 'react';

const BADGE_CONFIG = {
  pending:   { label: 'Pending',   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200/60' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200/60' },
  cancelled: { label: 'Cancelled', color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200/60' },
  completed: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200/60' },
};

export default function AppointmentRowItem({ appointment, onStatusChange, onInspect }) {
  if (!appointment) return null;
  
  const currentStatus = appointment.status || 'pending';
  const cfg = BADGE_CONFIG[currentStatus] || BADGE_CONFIG.pending;

  const parseTime = (timeStr) => {
    if (!timeStr) return '—';
    try {
      const clean = timeStr.includes(' ') ? timeStr.split(' ') : timeStr;
      const parts = clean.split(':');
      if (parts.length < 2) return timeStr;
      
      const hour = parseInt(parts[0], 10);
      const minute = parts[1];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      
      return `${displayHour}:${minute} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const clean = dateStr.includes(' ') ? dateStr.split(' ') : dateStr;
      const parts = clean.split('-');
      if (parts.length < 3) return dateStr;
      
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      
      return new Date(year, month, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
    } catch (e) {
      return dateStr;
    }
  };

  const handleRowIntersection = (e) => {
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return; 
    if (onInspect) onInspect(appointment);
  };

  return (
    <tr 
      onClick={handleRowIntersection}
      className="group border-b border-slate-100 hover:bg-slate-50/40 cursor-pointer transition-colors text-xs text-slate-700 relative"
    >
      <td className="py-3.5 px-5 font-mono font-black text-slate-900 text-left whitespace-nowrap">
        {parseTime(appointment.start_time)}
      </td>
      
      <td className="py-3.5 px-5 text-left text-slate-400 font-bold font-mono whitespace-nowrap uppercase text-[10px]">
        {parseDate(appointment.start_time)}
      </td>

      <td className="py-3.5 px-5 text-left font-black text-slate-800 max-w-xs truncate tracking-tight">
        {appointment.service_name || 'Service Session'}
      </td>

      <td className="py-3.5 px-5 text-left font-bold text-slate-500 max-w-xs truncate">
        👤 {appointment.customer_name || 'Walk-in Client'}
      </td>

      <td className="py-3.5 px-5 text-right font-mono font-black text-slate-900 whitespace-nowrap">
        {window.igniteSettings?.currency_symbol || 'Rs. '}{parseFloat(appointment.price || 0).toFixed(2)}
      </td>

      {/* TAILWIND V4 COMPLIANT DROPDOWN ENCLOSURE */}
      <td className="py-3.5 px-5 text-right whitespace-nowrap min-w-32.5">
        <div className="inline-block relative text-left">
          <select
            value={currentStatus}
            onChange={(e) => onStatusChange && onStatusChange(appointment.id, e.target.value)}
            className={`cursor-pointer px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border outline-none text-center transition-all bg-no-repeat pr-6 shadow-3xs focus:ring-2 focus:ring-slate-200/50 appearance-none font-sans ${cfg.bg} ${cfg.border} ${cfg.color}`}
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://w3.org' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 0.4rem center',
              backgroundSize: '1rem',
            }}
          >
            <option value="pending" className="bg-white text-slate-900">Pending</option>
            <option value="confirmed" className="bg-white text-slate-900">Confirm</option>
            <option value="completed" className="bg-white text-slate-900">Complete</option>
            <option value="cancelled" className="bg-white text-slate-900">Cancel</option>
          </select>
        </div>
        
        {/* Full-width blue underline indicator microline animation matches row dimensions */}
        <td className="absolute bottom-0 left-0 right-0 p-0 h-[1.5px] pointer-events-none">
          <div className="w-full h-full bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
        </td>
      </td>
    </tr>
  );
}

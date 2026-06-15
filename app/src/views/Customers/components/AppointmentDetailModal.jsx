import React from 'react';
import Button from '../../../components/ui/Button';

export default function AppointmentDetailModal({ appointment, onClose }) {
  if (!appointment) return null;

  const rawNotes = appointment.notes || appointment.internal_notes || '';
  let manifestServices = [];
  let customerTextNotes = 'No special customer text notes provided.';

  if (typeof rawNotes === 'string' && rawNotes.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawNotes);
      if (Array.isArray(parsed.services)) manifestServices = parsed.services;
      customerTextNotes = parsed.user_notes || 'No special customer text notes provided.';
    } catch (e) { console.error(e); }
  } else if (typeof rawNotes === 'string' && rawNotes.includes('[Services:')) {
    try {
      const parts = rawNotes.split('|');
      const servicePart = parts[0].replace('[Services:', '').replace(']', '').trim();
      customerTextNotes = parts[1] ? parts[1].trim() : 'No special customer text notes provided.';
      const namesArray = servicePart.split(',').map(n => n.trim());
      
      const basePrice = parseFloat(appointment.price || 0);
      manifestServices = namesArray.map((name, index) => ({
        id: `legacy-${index}`,
        name: name || 'Service Session',
        price: index === 0 && namesArray.length === 1 ? basePrice : (basePrice / namesArray.length),
        duration: parseInt(appointment.duration || 30, 10)
      }));
    } catch (err) { console.error(err); }
  }

  if (manifestServices.length === 0) {
    manifestServices = [{ id: appointment.service_id, name: appointment.service_name || 'Service', price: appointment.price || 0, duration: appointment.duration || 30 }];
    customerTextNotes = rawNotes || 'No special customer text notes provided.';
  }

  const totalDuration = manifestServices.reduce((sum, s) => sum + (parseInt(s.duration, 10) || 0), 0);
  const currencySymbol = window.igniteSettings?.currency_symbol || '$';
  
  const formatPrice = (val) => {
    const num = parseFloat(val || 0).toFixed(2);
    return currencySymbol.length > 1 || currencySymbol.includes('.') ? `${currencySymbol} ${num}` : `${currencySymbol}${num}`;
  };

  const InfoRow = ({ label, value, isMono = false }) => (
    <div className="flex justify-between border-b border-slate-100/60 pb-1.5 font-semibold text-slate-500">
      <span>{label}</span>
      <span className={`text-slate-800 font-bold ${isMono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );

  return (
    /* 🌟 FIXED VIEWPORT SHELL: Allows the whole popup canvas to scroll fluidly on long content [INDEX] */
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-start justify-center p-4 overflow-y-auto scrollbar-thin" onClick={onClose}>
      <div className="group bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-3.5 relative text-left animate-scale-up select-none my-8 overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header Desk */}
        <div className="border-b border-slate-100 pb-2.5 flex items-start justify-between gap-4">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Ledger Transaction</span>
            <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase mt-0.5 truncate max-w-56">
              {manifestServices.length > 1 ? 'Multi-Service Session' : manifestServices[0].name}
            </h3>
            <span className="text-[9px] font-mono font-bold text-slate-400 block mt-0.5">APPT INDEX REF: #{appointment.id}</span>
          </div>
          <span className={`inline-block text-[9px] font-black px-2 py-0.5 border rounded-md uppercase tracking-wider ${String(appointment.status).toLowerCase() === 'confirmed' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
            {appointment.status || 'Pending'}
          </span>
        </div>

        {/* Stat Cards Grid Row */}
        <div className="grid grid-cols-3 gap-2 text-center font-sans">
          {[
            { label: 'Total Price', val: formatPrice(appointment.price) },
            { label: 'Duration', val: `⏱ ${totalDuration} m` },
            { label: 'Margins', val: `+${appointment.buffer_after || 0}m pad` }
          ].map((stat, i) => (
            <div key={i} className="bg-slate-50/60 border border-slate-100 rounded-xl p-2 shadow-3xs">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{stat.label}</span>
              <span className="text-xs font-mono font-black text-slate-900 block mt-0.5">{stat.val}</span>
            </div>
          ))}
        </div>

        {/* Service Basket — No cramped micro scroll limits [INDEX] */}
        <div className="space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">Service Basket</span>
          <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
            {manifestServices.map((srv, idx) => (
              <div key={idx} className="p-2 flex items-center justify-between text-[11px] text-slate-700 hover:bg-slate-50/40 transition-colors font-semibold">
                <span className="truncate flex-1 text-left pr-2 font-bold text-slate-800">{srv.name}</span>
                <span className="font-mono font-black text-slate-600 bg-slate-50 px-1.5 py-0.5 border border-slate-100 rounded text-[10px]">{formatPrice(srv.price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coordinates Details */}
        <div className="space-y-1 pt-0.5 text-xs">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">Coordinates</span>
          <div className="bg-slate-50/30 border border-slate-100 rounded-xl p-2.5 space-y-1.5">
            <InfoRow label="Specialist:" value={appointment.employee_name || 'Staff'} />
            <InfoRow label="Date:" value={appointment.booking_date} isMono={true} />
            <InfoRow label="Time:" value={String(appointment.booking_time || '00:00').substring(0, 5)} isMono={true} />
          </div>
        </div>

        {/* Notes Text Input Box */}
        <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-2.5 shadow-3xs text-left">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Notes</span>
          <p className="text-[11px] font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{customerTextNotes}</p>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end pt-1.5 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onClose} className="px-4 font-bold rounded-lg cursor-pointer">Close</Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[2px] w-full scale-x-0 origin-left bg-blue-600 transition-transform duration-300 group-hover:scale-x-100" />
      </div>
    </div>
  );
}

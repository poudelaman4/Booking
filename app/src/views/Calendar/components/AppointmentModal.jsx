import React from 'react';

export default function AppointmentModal({ activeModal, onClose }) {
  if (!activeModal) return null;

  // 🧠 1. SELF-HEALING ENGINE: Parse standard JSON records or safely process string fallbacks
  const rawNotes = activeModal.notes || activeModal.internal_notes || '';
  let manifestServices = [];
  let customerTextNotes = 'No special customer text notes provided.';

  if (typeof rawNotes === 'string' && rawNotes.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawNotes);
      if (Array.isArray(parsed.services)) manifestServices = parsed.services;
      customerTextNotes = parsed.user_notes || 'No special customer text notes provided.';
    } catch (e) { console.error(e); }
  }

  // 🌟 FIX UNLOCKED: Rebuild the item row map using the real activeModal.service_name instead of a hardcoded text string [INDEX]!
  if (manifestServices.length === 0) {
    manifestServices = [{
      id: activeModal.service_id || 0,
      name: activeModal.service_name || 'Service Session',
      price: activeModal.price || 0,
      duration: activeModal.duration || 30
    }];
    customerTextNotes = rawNotes || 'No special customer text notes provided.';
  }

  // 🧠 2. FIXED STRUCTURAL MATH LOOKUPS: Accumulate TOTAL DURATION from all services [INDEX]!
  const totalDurationMins = manifestServices.reduce((sum, s) => sum + (parseInt(s.duration, 10) || 0), 0);

  // DEFENSIVE KEY RESOLUTION: Handles all incoming multi-frontend name allocations [INDEX]
  const resolvedStaffName = activeModal.employee_name || activeModal.staff_name || activeModal.staff?.name || 'Specialist';

  // GLOBAL LUXURY CURRENCY FORMATTING DESK
  const currencySymbol = window.igniteSettings?.currency_symbol || '$';
  const formatPrice = (val) => {
    const num = parseFloat(val || 0).toFixed(2);
    return currencySymbol.length > 1 || currencySymbol.includes('.') ? `${currencySymbol} ${num}` : `${currencySymbol}${num}`;
  };

  const formatDateToSentence = (dateStr) => {
    if (!dateStr) return '---';
    try {
      const [datePart, timePart] = dateStr.split(' ');
      const [year, month, day] = datePart.split('-');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[parseInt(month, 10) - 1]} ${day}, ${year} at ${timePart.substring(0, 5)}`;
    } catch { return dateStr; }
  };
  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-start justify-center p-4 overflow-y-auto scrollbar-thin" onClick={onClose}>
      <div className="group bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-3.5 relative text-left animate-scale-up select-none my-8 overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header Block Section */}
        <div className="border-b border-slate-100 pb-2.5 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 text-left">
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block">Ledger Transaction</span>
            {/* 🌟 USER REFACTOR FIXED: Formats header display dynamically matching real database rows */}
            <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase mt-0.5 truncate max-w-56">
              {manifestServices.length > 1 ? 'Multi-Service Session' : manifestServices[0]?.name}
            </h3>
            <span className="text-[9px] font-mono font-bold text-slate-400 block mt-0.5">Booking Reference: #{activeModal.id}</span>
          </div>
          <span className={`inline-block text-[9px] font-black px-2 py-0.5 border rounded-md uppercase tracking-wider ${String(activeModal.status).toLowerCase() === 'confirmed' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
            {activeModal.status || 'Pending'}
          </span>
        </div>

        {/* Operational Timeline Frame Blocks */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 border border-slate-100 rounded-xl text-[11px] font-sans text-slate-600">
          <div>
            <span className="font-bold text-slate-400 block uppercase tracking-wide text-[8px] mb-0.5">Session Starts</span>
            <span className="text-slate-900 font-mono font-bold">{formatDateToSentence(activeModal.start_time)}</span>
          </div>
          <div>
            <span className="font-bold text-slate-400 block uppercase tracking-wide text-[8px] mb-0.5">Session Concludes</span>
            <span className="text-slate-900 font-mono font-bold">{formatDateToSentence(activeModal.end_time)}</span>
          </div>
        </div>

        {/* Manifest Service Basket Items List */}
        <div className="space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">Manifest Service Basket Items</span>
          <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
            {manifestServices.map((srv, idx) => (
              <div key={idx} className="p-2 flex items-center justify-between text-[11px] text-slate-700 hover:bg-slate-50/40 transition-colors font-semibold">
                <span className="truncate flex-1 text-left pr-2 font-bold text-slate-800">{srv.name}</span>
                <span className="font-mono font-black text-slate-600 bg-slate-50 px-1.5 py-0.5 border border-slate-100 rounded text-[10px]">{formatPrice(srv.price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Execution Coordinates Sheet */}
        <div className="space-y-1 pt-0.5 text-xs">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">Execution Coordinates</span>
          <div className="bg-slate-50/30 border border-slate-100 rounded-xl p-2.5 space-y-1.5">
            <div className="flex justify-between border-b border-slate-100/60 pb-1.5 font-semibold text-slate-500">
              <span>Assigned Specialist:</span>
              <span className="text-slate-800 font-bold">{resolvedStaffName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100/60 pb-1.5 font-semibold text-slate-500">
              <span>Service Duration:</span>
              <span className="text-slate-800 font-bold font-mono">⏱ {totalDurationMins} mins</span>
            </div>
          </div>
        </div>

        {/* Customer Reminders Notes Box */}
        <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-2.5 shadow-3xs text-left">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Customer Reminders Notes</span>
          <p className="text-[11px] font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{customerTextNotes}</p>
        </div>

        {/* Financial Settlement Footer Matrix block */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block text-left">Aggregated Transaction Total</span>
          <span className="text-emerald-600 font-black text-xl tracking-tight shrink-0 font-mono">
            {formatPrice(activeModal.price)}
          </span>
        </div>

        {/* Close triggers button actions */}
        <div className="flex justify-end pt-1">
          <button type="button" onClick={onClose} className="px-4 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-[10px] font-black text-slate-500 uppercase tracking-wider rounded-lg shadow-3xs cursor-pointer outline-none transition-colors">
            Close Details
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-0.5 w-full scale-x-0 origin-left bg-blue-600 transition-transform duration-300 group-hover:scale-x-100" />
      </div>
    </div>
  );
}

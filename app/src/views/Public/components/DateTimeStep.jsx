import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../api/client';
import Button from '../../../components/ui/Button';

const getLocalTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DateTimeStep({
  date, startTime, totalDuration, selectedServices = [],
  onDateChange, onTimeSelect, onBack, onNext,
}) {
  const [slots, setSlots]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!date || totalDuration <= 0 || !Array.isArray(selectedServices) || selectedServices.length === 0) return;
    
    setLoading(true); setError(null);
    const serviceIdsParam = selectedServices.map(s => s.id).join(',');
    
    apiClient.request(`appointments/slots?employee_id=0&service_ids=${serviceIdsParam}&date=${date}&duration=${totalDuration}`)
      .then(res => setSlots(Array.isArray(res) ? res : []))
      .catch(() => { setError('Could not load available times.'); setSlots([]); })
      .finally(() => setLoading(false));
  }, [date, totalDuration, selectedServices]);

  // 🌟 FIXED STRING CONVERSION: Safely extracts time positions using explicit indexes
  const cleanTime = (ts) => {
    if (!ts || !ts.includes(' ')) return '';
    try {
      const parts = ts.split(' ');
      if (parts.length < 2) return '';
      const timePart = parts[1]; // Safely targets '09:30:00'
      return timePart ? timePart.substring(0, 5) : ''; // Returns '09:30'
    } catch (e) {
      return '';
    }
  };

  // 🧠 LIVE REAL-TIME MATRIX EVALUATOR: Determines if a slot timestamp resides in the past
  const isSlotPast = (slotStartStr) => {
    if (!slotStartStr) return false;
    try {
      const slotTimeMs = new Date(slotStartStr.replace(' ', 'T')).getTime();
      const nowMs = Date.now();
      return slotTimeMs < nowMs;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="space-y-5 font-sans">

      {/* Header Layout */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="text-left">
          <h2 className="text-sm font-black text-slate-900 tracking-tight">Date &amp; Time</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Choose when you'd like your appointment.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={onBack}>
          ← Back
        </Button>
      </div>

      {/* Date input tracker */}
      <div className="flex flex-col gap-1.5 text-left">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Date</label>
        <input
          type="date"
          value={date}
          min={getLocalTodayString()} 
          onChange={e => onDateChange(e.target.value)}
          className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 bg-white rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all cursor-pointer"
        />
      </div>

      {/* Time slots grid deck */}
      <div className="flex flex-col gap-2 text-left">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Available times</label>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2.5">
            <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Loading times...</span>
          </div>
        ) : error ? (
          <div className="px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700">{error}</div>
        ) : slots.length === 0 ? (
          <div className="p-5 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <p className="text-xs font-semibold text-slate-500">No available times on this date.</p>
            <p className="text-[10px] text-slate-400 mt-1">Try a different date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {slots.map((slot, i) => {
              const t = cleanTime(slot.start);
              if (!t) return null;

              const isPast = isSlotPast(slot.start);

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isPast} 
                  onClick={() => onTimeSelect(t)}
                  className={`py-2 rounded-lg border-2 font-mono text-xs font-bold transition-all
                    ${isPast 
                      ? 'border-slate-100 bg-slate-50/60 text-slate-300 cursor-not-allowed line-through opacity-60 shadow-none' 
                      : startTime === t
                        ? 'border-blue-500 bg-blue-600 text-white shadow-3xs cursor-pointer'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 cursor-pointer'
                    }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {startTime && !loading && (
        <button
          type="button"
          onClick={onNext}
          className="group relative w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-[12px] font-black text-blue-600 uppercase tracking-wide cursor-pointer transition-colors outline-none overflow-hidden"
        >
          Find staff for {startTime} →
          <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
        </button>
      )}
    </div>
  );
}

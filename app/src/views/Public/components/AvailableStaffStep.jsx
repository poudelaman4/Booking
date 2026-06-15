import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../api/client';

export default function AvailableStaffStep({
  date, startTime, totalDuration, selectedServices = [], onSelectStaff, onBack,
}) {
  const [staff, setStaff]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!Array.isArray(selectedServices) || selectedServices.length === 0) return;
    
    let active = true;
    setLoading(true); setError(null);
    
    // 🧠 MULTI-SERVICE MAP ENGINE: Transforms checked elements into deep intersected skill tokens
    const serviceIdsParam = selectedServices.map(s => s.id).join(',');

    // 🌟 FIX UNLOCKED: Forces capability intersection lookups natively across all basket service items!
    apiClient.request(
      `appointments/available-staff?date=${date}&time=${startTime}&duration=${totalDuration}&service_ids=${serviceIdsParam}`
    )
      .then(res  => { if (active) setStaff(Array.isArray(res) ? res : []); })
      .catch(()  => { if (active) setError('Could not load available staff.'); })
      .finally(() => { if (active) setLoading(false); });
      
    return () => { active = false; };
  }, [date, startTime, totalDuration, selectedServices]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-400">Checking staff availability...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-black text-slate-900 tracking-tight">Choose a Staff Member</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Available for {totalDuration} min on {date} at {startTime}.
          </p>
        </div>
        <button type="button" onClick={onBack} className="group relative px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-md text-[10px] font-black text-slate-500 uppercase tracking-wider cursor-pointer transition-colors outline-none overflow-hidden shrink-0">
          ← Back
          <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
        </button>
      </div>

      {error ? (
        <div className="px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700">{error}</div>
      ) : staff.length === 0 ? (
        <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <p className="text-xs font-semibold text-slate-500">No staff available at this time.</p>
          <p className="text-[10px] text-slate-400 mt-1">Try a different time or date or adjust basket.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {staff.map(member => (
            <div key={member.id} className="flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-slate-50/50 transition-all">
              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-black flex items-center justify-center shrink-0">
                {(member.first_name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-black text-slate-900 block">{member.first_name} {member.last_name || ''}</span>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                  Available
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectStaff(member.id)}
                className="group relative px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200/60 rounded-md text-[10px] font-black text-blue-600 uppercase tracking-wider cursor-pointer transition-colors outline-none overflow-hidden shrink-0"
              >
                Select
                <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

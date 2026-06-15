import React from 'react';

export default function BookingSummary({ servicesList, totalPrice, totalDuration, startTime, currency = '$' }) {
  return (
    <div className="bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100 border-l-4 border-l-blue-600 rounded-xl p-4 space-y-3">

      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-slate-900 tracking-tight">Booking Summary</span>
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">✓</div>
      </div>

      <div className="bg-white border border-blue-100 rounded-lg p-2.5">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Services</span>
        <p className="text-xs font-semibold text-slate-800 leading-relaxed">{servicesList}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border border-blue-100 rounded-lg p-2.5">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Duration</span>
          <span className="text-base font-black text-slate-900">{totalDuration} <small className="text-[10px] font-normal text-slate-400">min</small></span>
        </div>
        <div className="bg-white border border-blue-100 rounded-lg p-2.5">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Total</span>
          <span className="text-base font-black text-blue-600">{currency}{totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {startTime && (
        <div className="bg-white border-2 border-emerald-200 rounded-lg p-2.5">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Time Reserved</span>
          <span className="text-sm font-black text-emerald-700">{startTime}</span>
        </div>
      )}
    </div>
  );
}
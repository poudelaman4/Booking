import React from 'react';

export default function HeaderMetrics({ staffName, isAllTime, setIsAllTime, selectedDate, setSelectedDate }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
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
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer outline-none h-8 flex items-center justify-center
            ${isAllTime 
              ? 'bg-slate-50 border-slate-300 text-slate-700 shadow-2xs font-extrabold' 
              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
        >
          <span>{isAllTime ? '🗓️ Show Daily Grid' : '📁 View All History'}</span>
        </button>

        {!isAllTime && (
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1 h-8 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition-colors cursor-pointer"
          />
        )}
      </div>
    </header>
  );
}

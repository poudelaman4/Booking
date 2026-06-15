import React from 'react';

export default function FilterTabs({ activeFilter, onFilterChange, filterOptions, pendingCount }) {
  return (
    <div className="flex items-center gap-6 border-b border-slate-100 w-full justify-start pb-0.5 select-none">
      {filterOptions.map(f => {
        const isActive = activeFilter === f.key;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onFilterChange(f.key)}
            className={`group relative pb-2.5 text-[11px] font-black uppercase tracking-widest transition-all outline-none flex items-center gap-2 cursor-pointer bg-transparent border-none
              ${isActive ? 'text-slate-900 font-black' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span>{f.label}</span>
            {f.key === 'pending' && pendingCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[8px] font-black shadow-3xs animate-pulse">
                {pendingCount}
              </span>
            )}
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 transition-transform duration-200 origin-left
              ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'}`} 
            />
          </button>
        );
      })}
    </div>
  );
}

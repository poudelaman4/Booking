import React from 'react';

export default function ServiceStreamColumn({ services = [], hasSelectedLeaf, activeCategoryId, onAddService, onEditService, onDeleteService }) {
  return (
    <div className="flex-1 bg-white p-4 min-w-95 overflow-y-auto flex flex-col font-sans text-left transition-all duration-300 animate-fade-in">
      <div className="flex items-center justify-between mb-3 px-1 shrink-0">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Services</span>
        {/* 🛡️ RULE LOCK SYSTEM: Only available if this is a true terminal folder leaf branch! */}
        {hasSelectedLeaf && (
          <button 
            onClick={() => onAddService(activeCategoryId)}
            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 outline-none cursor-pointer uppercase tracking-wider"
          >
            + Add Service Card
          </button>
        )}
      </div>

      {!hasSelectedLeaf ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-100 rounded-xl bg-slate-50/30">
          <p className="text-xs font-bold text-slate-400 tracking-tight">Select an active folder lane block node.</p>
        </div>
      ) : services.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-100 rounded-xl bg-slate-50/30">
          <p className="text-xs font-bold text-slate-400">No standalone items mapped inside this leaf category folder slot.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-white shadow-2xs">
          {services.map(srv => (
            <div 
              key={srv.id} 
              onClick={() => onEditService(srv)} // 🌟 CLICK TO EDIT REUSE ENGINE INTERACTION LOCK! [INDEX]
              className="group relative flex items-center justify-between p-4.5 bg-white transition-colors duration-150 hover:bg-slate-50/10 cursor-pointer select-none"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {srv.image_url && <img src={srv.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-100 bg-slate-50 shrink-0" />}
                <div className="min-w-0 flex-1 text-left">
                  <span className="text-xs font-bold text-slate-900 tracking-tight block truncate group-hover:text-blue-600 transition-colors">
                    {srv.name}
                  </span>
                  {srv.description && <span className="text-[11px] text-slate-400 font-medium block mt-1 truncate max-w-md">{srv.description}</span>}
                </div>
              </div>

              <div className="flex items-center gap-5 text-right shrink-0 pl-3 relative z-10">
                <div className="text-right font-sans mr-2">
                  {/* 🌟 USER REFACTOR FIXED: Dynamic Global Currency Symbol Check Applied [INDEX] */}
                  <span className="text-sm font-mono font-black text-slate-800 block">
                    {window.igniteSettings?.currency_symbol || '$'}{parseFloat(srv.price || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 block mt-0.5">⏱ {srv.duration || 30} mins</span>
                </div>
                {/* Clean inline text delete link action shortcut */}
                <button 
                  onClick={(e) => onDeleteService(srv.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-slate-400 hover:text-rose-600 uppercase tracking-wide transition-opacity p-1"
                >
                  Delete
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-[1.5px] w-full scale-x-0 origin-left bg-blue-600 transition-transform duration-200 group-hover:scale-x-100" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

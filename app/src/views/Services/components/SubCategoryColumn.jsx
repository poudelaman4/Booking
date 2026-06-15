import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../../api/client';

export default function SubCategoryColumn({ 
  categories = [], services = [], activeParentFolderId, currentDepthIdx, openColumnsPath, 
  onSelectNode, onAddSubCategory, onEditCategory, onDeleteCategory, refreshTrigger 
}) {
  const [loading, setLoading] = useState(false);
  const [subFolders, setSubFolders] = useState([]);

  // Live dependency tracking listener: forces immediate local data re-fetches cleanly
  useEffect(() => {
    if (!activeParentFolderId) return;
    
    const fetchSubBranches = async () => {
      try {
        setLoading(true);
        const res = await apiClient.request(`categories?parent_id=${activeParentFolderId}`);
        setSubFolders(Array.isArray(res) ? res : []);
      } catch (e) {
        setSubFolders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSubBranches();
  }, [activeParentFolderId, refreshTrigger]);

  const laneHasServicesRule = useMemo(() => {
    return services.some(s => String(s.category_id) === String(activeParentFolderId));
  }, [services, activeParentFolderId]);

  return (
    <div className="w-60 border-r border-slate-100 bg-white p-4 shrink-0 space-y-1.5 overflow-y-auto flex flex-col text-left font-sans transition-all duration-300 animate-fade-in relative group">
      <div className="flex items-center justify-between mb-3 px-1 shrink-0">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subcategories</span>
        {!laneHasServicesRule && (
          <button 
            onClick={() => onAddSubCategory(activeParentFolderId)}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 outline-none cursor-pointer"
          >
            + Add Sub
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-10 flex justify-center items-center flex-1">
          <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : subFolders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4 border border-dashed border-slate-100 rounded-xl bg-slate-50/30">
          <p className="text-[11px] font-semibold text-slate-400 text-center leading-relaxed">
            Empty folder directory branch.<br />Hit Add Sub above to append child folders.
          </p>
        </div>
      ) : (
        subFolders.map(sub => {
          const isSelected = openColumnsPath[currentDepthIdx] === sub.id;
          return (
            <div
              key={sub.id}
              onClick={() => onSelectNode(sub, currentDepthIdx)}
              className={`group/item relative w-full px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 flex items-center justify-between gap-2 ${isSelected ? 'bg-slate-50 text-slate-900 font-bold' : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-800 font-semibold'}`}
            >
              <div className="min-w-0 flex-1 text-left">
                <span className="text-xs tracking-tight block truncate">{sub.name}</span>
              </div>
              
              <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-1.5 transition-opacity shrink-0 relative z-10">
                <button onClick={(e) => { e.stopPropagation(); onEditCategory(sub); }} className="text-[9px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-wide">Edit</button>
                <button onClick={(e) => onDeleteCategory(sub.id, e)} className="text-[9px] font-bold text-slate-400 hover:text-rose-600 uppercase tracking-wide">Del</button>
              </div>
              <span className={`text-[9px] font-mono group-hover/item:hidden ${isSelected ? 'text-blue-600 font-black' : 'text-slate-300'}`}>▶</span>
              <div className="absolute bottom-0 left-3.5 right-3.5 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover/item:scale-x-100" />
            </div>
          );
        })
      )}
    </div>
  );
}

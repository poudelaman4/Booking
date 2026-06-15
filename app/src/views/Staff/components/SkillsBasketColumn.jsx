import React, { useState, useMemo, useEffect } from 'react';
import { apiClient } from '../../../api/client';

export default function SkillsBasketColumn({ services = [], assignedServices = [], categories = [], isActiveSelected, staffName, onToggleSkill }) {
  const [navigationHistory, setNavigationHistory] = useState([]); 
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [liveSubCategories, setLiveSubCategories] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  useEffect(() => {
    setNavigationHistory([]);
    setSelectedCategoryId(null);
    setLiveSubCategories([]);
  }, [staffName]);

  useEffect(() => {
    if (selectedCategoryId === null) {
      setLiveSubCategories([]);
      return;
    }
    const fetchSubCategoryLayersOnDemand = async () => {
      try {
        setLoadingSubs(true);
        const res = await apiClient.request(`categories?parent_id=${selectedCategoryId}`);
        setLiveSubCategories(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed fetching child subfolder nodes:", err);
        setLiveSubCategories([]);
      } finally {
        setLoadingSubs(false);
      }
    };
    fetchSubCategoryLayersOnDemand();
  }, [selectedCategoryId]);

  const rootCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return categories.filter(c => {
      if (!c.parent_id) return true;
      const pNum = parseInt(c.parent_id, 10);
      return isNaN(pNum) || pNum === 0;
    });
  }, [categories]);

  const currentDirectServices = useMemo(() => {
    if (selectedCategoryId === null || !Array.isArray(services)) return [];
    return services.filter(s => String(s.category_id) === String(selectedCategoryId));
  }, [services, selectedCategoryId]);

  const handleStepDeeperIntoCategory = (cat) => {
    setSelectedCategoryId(cat.id);
    setNavigationHistory(prev => [...prev, cat]);
  };

  const handleStepBackward = () => {
    setNavigationHistory(prev => {
      const updated = prev.slice(0, -1);
      if (updated.length === 0) {
        setSelectedCategoryId(null);
      } else {
        setSelectedCategoryId(updated[updated.length - 1].id);
      }
      return updated;
    });
  };

  const isSkillAssigned = (serviceId) => {
    if (!Array.isArray(assignedServices)) return false;
    return assignedServices.includes(serviceId);
  };

  if (!isActiveSelected) {
    return (
      <div className="flex-1 bg-white p-4 min-w-90 overflow-y-auto flex flex-col font-sans text-left">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 pl-1">Assigned Capabilities</span>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-100 rounded-xl bg-slate-50/30">
          <p className="text-xs font-bold text-slate-400 tracking-tight">Select a staff member from the roster.</p>
        </div>
      </div>
    );
  }

  const hasSubCategoriesDownstream = liveSubCategories.length > 0 || loadingSubs;
  const isLeafLevel = !hasSubCategoriesDownstream && !loadingSubs && selectedCategoryId !== null;
  return (
    <div className="flex-1 bg-white p-4 min-w-90 overflow-y-auto flex flex-col font-sans text-left transition-all duration-300">
      
      {/* HEADER NAVIGATION ACTION BUTTON ROW */}
      <div className="flex items-center justify-between mb-3 px-1 shrink-0 select-none">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Assigned Capabilities
        </span>
        
        {navigationHistory.length > 0 && (
          <button 
            onClick={handleStepBackward}
            className="group relative px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg text-[10px] font-black text-blue-600 uppercase tracking-wider cursor-pointer transition-colors outline-none overflow-hidden"
          >
            <span>← Back</span>
            <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
          </button>
        )}
      </div>

      <div className="space-y-3.5 flex-1 flex flex-col select-none">
        <div className="px-1 shrink-0 flex flex-col gap-1">
          <h4 className="text-xs font-black text-slate-800 tracking-tight">Capabilities for {staffName}</h4>
          {navigationHistory.length > 0 && (
            <div className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Path: Root {navigationHistory.map(item => ` / ${item.name}`)}
            </div>
          )}
        </div>

        {loadingSubs && (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {/* LEVEL 0: ROOT OVERVIEW */}
        {!loadingSubs && selectedCategoryId === null && (
          <div className="flex-1 space-y-1.5 overflow-y-auto animate-fade-in">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1 mb-2">Select Primary Sector</span>
            {rootCategories.map(cat => (
              <div
                key={cat.id}
                onClick={() => handleStepDeeperIntoCategory(cat)}
                className="group relative w-full px-4 py-3 bg-white border border-slate-100 rounded-xl cursor-pointer transition-colors duration-150 text-slate-600 hover:border-slate-300 hover:bg-slate-50/30 hover:text-slate-900 flex items-center justify-between gap-2"
              >
                <span className="text-xs font-semibold tracking-tight block truncate">{cat.name}</span>
                <span className="text-[10px] font-mono text-slate-300 group-hover:text-blue-600 transition-colors">▶</span>
                <div className="absolute bottom-0 left-3.5 right-3.5 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
              </div>
            ))}
          </div>
        )}

        {/* LEVEL 1: SUBCATEGORIES DRILL DOWN */}
        {!loadingSubs && selectedCategoryId !== null && hasSubCategoriesDownstream && (
          <div className="flex-1 space-y-1.5 overflow-y-auto animate-fade-in">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1 mb-2">Select Subcategory</span>
            {liveSubCategories.map(sub => (
              <div
                key={sub.id}
                onClick={() => handleStepDeeperIntoCategory(sub)}
                className="group relative w-full px-4 py-3 bg-white border border-slate-100 rounded-xl cursor-pointer transition-colors duration-150 text-slate-600 hover:border-slate-300 hover:bg-slate-50/30 hover:text-slate-900 flex items-center justify-between gap-2"
              >
                <span className="text-xs font-semibold tracking-tight block truncate">{sub.name}</span>
                <span className="text-[10px] font-mono text-slate-300 group-hover:text-blue-600 transition-colors">▶</span>
                <div className="absolute bottom-0 left-3.5 right-3.5 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
              </div>
            ))}
          </div>
        )}

        {/* LEVEL 2: ACTIVE RECURSIVE SERVICES MATRIX CHECKLIST */}
        {!loadingSubs && isLeafLevel && (
          <div className="flex-1 overflow-y-auto animate-fade-in pr-0.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1 mb-2">Toggle Assigned Services</span>
            
            {currentDirectServices.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-100 rounded-xl bg-slate-50/20">
                <p className="text-xs font-bold text-slate-400">No services assigned inside this folder directory branch.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-white shadow-2xs">
                {currentDirectServices.map(srv => {
                  const assigned = isSkillAssigned(srv.id);
                  return (
                    <div 
                      key={srv.id}
                      onClick={() => onToggleSkill(srv.id)}
                      className="group relative flex items-center justify-between p-3.5 bg-white transition-colors duration-150 hover:bg-slate-50/10 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
                        <div className="w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors" style={{ borderColor: assigned ? '#2563eb' : '#cbd5e1', backgroundColor: assigned ? '#2563eb' : '#ffffff' }}>
                          {assigned && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-blue-600 transition-colors">
                            {srv.name}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 pl-3 text-right">
                        {/* 🌟 USER REFACTOR FIXED: Swapped hardcoded '$' with the global option parameter value token */}
                        <span className="text-xs font-mono font-black text-slate-900 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md shadow-2xs">
                          {window.igniteSettings?.currency_symbol || '$'}{parseFloat(srv.price || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] w-full scale-x-0 origin-left bg-blue-600 transition-transform duration-200 group-hover:scale-x-100" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

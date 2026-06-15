import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiClient } from '../../api/client';
import SubCategoryColumn from './components/SubCategoryColumn';
import ServiceStreamColumn from './components/ServiceStreamColumn';
import CategoryFormModal from './components/CategoryFormModal';
import ServiceFormModal from './components/ServiceFormModal';
import Button from '../../components/ui/Button';

export default function ServicesView() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  
  // Array of Category IDs tracking the active depth path: [rootId, subId, deepSubId...]
  const [openColumnsPath, setOpenColumnsPath] = useState([]); 
  const [selectedLeafCategoryId, setSelectedLeafCategoryId] = useState(null);
  
  // LIVE RE-SYNC CLOCK PROP: Ticks forward whenever a database mutation finishes
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(() => Date.now());

  // Modal State Controllers
  const [catModal, setCatModal] = useState({ isOpen: false, parentId: null, editTarget: null });
  const [serviceModal, setServiceModal] = useState({ isOpen: false, categoryId: null, editTarget: null });

  const scrollContainerRef = useRef(null);

  const refreshCatalogData = async () => {
    try {
      const [cats, srvs] = await Promise.all([
        apiClient.request('categories'),
        apiClient.request('services')
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setServices(Array.isArray(srvs) ? srvs : []);
      setLastSyncTimestamp(Date.now()); // Tick the layout listener forward!
    } catch (err) {
      console.error("Failed synchronizing live database layers:", err);
    }
  };

  useEffect(() => {
    refreshCatalogData().finally(() => setLoading(false));
  }, []);

  const rootCategories = useMemo(() => {
    return categories.filter(c => {
      if (!c.parent_id) return true;
      const pNum = parseInt(c.parent_id, 10);
      return isNaN(pNum) || pNum === 0;
    });
  }, [categories]);

  const leafNodeServices = useMemo(() => {
    if (!selectedLeafCategoryId) return [];
    return services.filter(s => String(s.category_id) === String(selectedLeafCategoryId));
  }, [services, selectedLeafCategoryId]);

  const handleColumnSelectionNodeEvent = async (cat, activeColumnDepthIdx) => {
    const updatedPath = [...openColumnsPath.slice(0, activeColumnDepthIdx), cat.id];
    setOpenColumnsPath(updatedPath);

    try {
      const subPayload = await apiClient.request(`categories?parent_id=${cat.id}`);
      const childrenList = Array.isArray(subPayload) ? subPayload : [];

      if (childrenList.length > 0) {
        setSelectedLeafCategoryId(null);
      } else {
        setSelectedLeafCategoryId(cat.id);
      }
    } catch (err) {
      setSelectedLeafCategoryId(cat.id);
    }

    setTimeout(() => {
      if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft += 320;
    }, 100);
  };

  const handleSaveCategoryFolder = async (formData) => {
    const isEdit = !!catModal.editTarget;
    const url = isEdit ? `categories/${catModal.editTarget.id}` : 'categories';
    const payload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      image_url: formData.image_url?.trim() || null,
      parent_id: isEdit ? catModal.editTarget.parent_id : (catModal.parentId ? parseInt(catModal.parentId, 10) : null)
    };
    try {
      await apiClient.request(url, { method: 'POST', body: JSON.stringify(payload) });
      setCatModal({ isOpen: false, parentId: null, editTarget: null });
      await refreshCatalogData();
    } catch (err) {
      alert(`Error saving category: ${err.message}`);
    }
  };

  const handleSaveServiceCard = async (servicePayload) => {
    const isEdit = !!serviceModal.editTarget;
    const url = isEdit ? `services/${serviceModal.editTarget.id}` : 'services';
    const payload = {
      ...servicePayload,
      category_id: isEdit ? serviceModal.editTarget.category_id : String(serviceModal.categoryId)
    };
    try {
      await apiClient.request(url, { method: 'POST', body: JSON.stringify(payload) });
      setServiceModal({ isOpen: false, categoryId: null, editTarget: null });
      await refreshCatalogData();
    } catch (err) {
      alert(`Error saving service item: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this folder category? All nested items will be unlinked.")) return;
    try {
      await apiClient.request(`categories/${id}`, { method: 'DELETE' });
      setOpenColumnsPath([]);
      setSelectedLeafCategoryId(null);
      await refreshCatalogData();
    } catch (err) {
      alert(`Delete Denied: ${err.message}`);
    }
  };

  const handleDeleteService = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this service item?")) return;
    try {
      await apiClient.request(`services/${id}`, { method: 'DELETE' });
      await refreshCatalogData();
    } catch (err) {
      alert(`Delete Denied: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 font-sans text-left pr-6">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading catalog explorer stream...</p>
      </div>
    );
  }
  // Dynamic cache resolver check for the live self-healing lane collapsing rules [INDEX]
  const lastActivePathId = openColumnsPath[openColumnsPath.length - 1];
  const hasSubCategoriesDownstream = categories.some(c => String(c.parent_id) === String(lastActivePathId));
  const isDirectServiceTier = !hasSubCategoriesDownstream && leafNodeServices.length > 0;

  return (
    <div className="w-full space-y-6 font-sans text-left text-slate-900 py-6 pr-6 animate-fade-in flex flex-col">
      <header className="border-b border-slate-100 pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Catalog Explorer</h1>
        </div>
        {openColumnsPath.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => { setOpenColumnsPath([]); setSelectedLeafCategoryId(null); }}>
            Reset Explorer View
          </Button>
        )}
      </header>

      {/* HORIZONTAL CASCADING DECK WORKSPACE GRID */}
      <div 
        ref={scrollContainerRef}
        className="w-full overflow-x-auto scrollbar-thin rounded-xl border border-slate-200 bg-white shadow-xs flex select-none min-h-125"
      >
        {/* COLUMN LAYER 0: THE PRIMARY ROOT SECTORS */}
        <div className="w-64 border-r border-slate-100 bg-slate-50/20 p-4 shrink-0 space-y-1.5 overflow-y-auto relative">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Sectors</span>
            <button 
              onClick={() => setCatModal({ isOpen: true, parentId: null, editTarget: null })}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 outline-none cursor-pointer"
            >
              + Add Sector
            </button>
          </div>
          {rootCategories.map(cat => {
            const isSelected = openColumnsPath.some(id => String(id) === String(cat.id));
            return (
              <div
                key={cat.id}
                onClick={() => handleColumnSelectionNodeEvent(cat, 0)}
                className={`group relative w-full px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${isSelected ? 'bg-slate-50 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50/60 hover:text-slate-900 font-semibold'}`}
              >
                <div className="flex items-center justify-between gap-2 w-full pr-1">
                  <span className="text-xs tracking-tight block truncate flex-1">{cat.name}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity shrink-0 relative z-10">
                    <button onClick={(e) => { e.stopPropagation(); setCatModal({ isOpen: true, parentId: null, editTarget: cat }); }} className="text-[9px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-wide">Edit</button>
                    <button onClick={(e) => handleDeleteCategory(cat.id, e)} className="text-[9px] font-bold text-slate-400 hover:text-rose-600 uppercase tracking-wide">Del</button>
                  </div>
                </div>
                <div className="absolute bottom-0 left-3.5 right-3.5 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
              </div>
            );
          })}
        </div>

        {/* CASCADING NESTED RECURSIVE SUB-COLUMNS */}
        {openColumnsPath.map((currentTrackId, currentPathIdx) => (
          <SubCategoryColumn 
            key={`${currentTrackId}-${currentPathIdx}`}
            categories={categories}
            services={services}
            activeParentFolderId={currentTrackId}
            currentDepthIdx={currentPathIdx + 1}
            openColumnsPath={openColumnsPath}
            onSelectNode={handleColumnSelectionNodeEvent}
            onAddSubCategory={(pId) => setCatModal({ isOpen: true, parentId: pId, editTarget: null })}
            onEditCategory={(cat) => setCatModal({ isOpen: true, parentId: null, editTarget: cat })}
            onDeleteCategory={handleDeleteCategory}
            refreshTrigger={lastSyncTimestamp} // Forward re-fetch snapshot timer down
          />
        ))}

        {/* COLUMN LAYER FINAL: DYNAMIC SERVICES STREAM MATRIX */}
        {isDirectServiceTier ? (
          <ServiceStreamColumn 
            services={leafNodeServices} hasSelectedLeaf={true} activeCategoryId={selectedLeafCategoryId}
            onAddService={(cId) => setServiceModal({ isOpen: true, categoryId: cId, editTarget: null })}
            onAddSubCategory={(pId) => setCatModal({ isOpen: true, parentId: pId, editTarget: null })}
            onEditService={(srv) => setServiceModal({ isOpen: true, categoryId: null, editTarget: srv })}
            onDeleteService={handleDeleteService}
          />
        ) : (
          <ServiceStreamColumn 
            services={leafNodeServices} hasSelectedLeaf={!!selectedLeafCategoryId} activeCategoryId={selectedLeafCategoryId}
            onAddService={(cId) => setServiceModal({ isOpen: true, categoryId: cId, editTarget: null })}
            onAddSubCategory={(pId) => setCatModal({ isOpen: true, parentId: pId, editTarget: null })}
            onEditService={(srv) => setServiceModal({ isOpen: true, categoryId: null, editTarget: srv })}
            onDeleteService={handleDeleteService}
          />
        )}
      </div>

      <CategoryFormModal isOpen={catModal.isOpen} editTarget={catModal.editTarget} onClose={() => setCatModal({ isOpen: false, parentId: null, editTarget: null })} onSave={handleSaveCategoryFolder} />
      <ServiceFormModal isOpen={serviceModal.isOpen} editTarget={serviceModal.editTarget} onClose={() => setServiceModal({ isOpen: false, categoryId: null, editTarget: null })} onSave={handleSaveServiceCard} />
    </div>
  );
}

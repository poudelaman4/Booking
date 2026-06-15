import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../api/client';

export default function ServiceSelect({
  loading, viewMode, categories = [], services = [],
  selectedServices = [], hasHistory,
  onCategoryClick, onServiceToggle, onBackClick, onProceed,
  totalPrice, totalDuration, currency = ''
}) {
  
  // 🧠 UPDATED STATUS TRACKER: Matches our backend responses ('valid' | 'unassigned' | 'impossible_combination')
  const [basketStatus, setBasketStatus] = useState('valid');
  const [checking, setChecking]         = useState(false);
  const debounceTimer                   = useRef(null);

  const formatPrice = (val) => {
    const sym = currency || window.igniteSettings?.currency_symbol || '$';
    const price = parseFloat(val || 0).toFixed(2);
    return sym.length > 1 ? `${sym} ${price}` : `${sym}${price}`;
  };

  // Live validator effect scans our newly added status fields securely [INDEX]
  useEffect(() => {
    if (selectedServices.length === 0) {
      setBasketStatus('valid');
      setChecking(false);
      return;
    }

    setChecking(true);
    clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const ids = selectedServices.map(s => s.id).join(',');
      
      apiClient.request(`appointments/capable-staff?service_ids=${ids}`)
        .then(res => {
          // 🌟 FIX UNLOCKED: Map response status directly to state instead of looking for .capable!
          setBasketStatus(res?.status || 'valid');
        })
        .catch(() => {
          setBasketStatus('valid'); // Fail safe fallback
        })
        .finally(() => setChecking(false));
    }, 350);

    return () => clearTimeout(debounceTimer.current);
  }, [selectedServices]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading services...</p>
      </div>
    );
  }

  const uniqueCategoryIds = [...new Set(selectedServices.map(s => s.category_id))];
  const isCrossCategory   = uniqueCategoryIds.length > 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left font-sans animate-fade-in">
      
      {/* LEFT BLOCK LANE: Shopping Content Grid */}
      <div className="lg:col-span-2 space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
              {viewMode === 'categories' ? 'Browse Services' : 'Select Services'}
            </h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              {viewMode === 'categories' ? 'Choose a category to get started' : 'Select one or more services'}
            </p>
          </div>
          {hasHistory && (
            <button
              type="button"
              onClick={onBackClick}
              className="group relative px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg text-xs font-bold transition-all"
            >
              <span>← Back</span>
              <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
            </button>
          )}
        </div>

        {/* Categories */}
        {viewMode === 'categories' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.length === 0 ? (
              <p className="col-span-full text-xs font-semibold text-slate-400 text-center py-12">No categories available.</p>
            ) : categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryClick(cat.id)}
                className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-300 flex flex-col h-40 w-full p-0 outline-none"
              >
                <div
                  className="w-full flex-1 bg-slate-100 bg-cover bg-center relative"
                  style={{ backgroundImage: cat.image_url ? `url(${cat.image_url})` : 'none' }}
                >
                  {!cat.image_url && <div className="absolute inset-0 bg-linear-to-br from-slate-50 to-slate-100" />}
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-900/10 to-transparent" />
                  <span className="absolute bottom-0 left-0 right-0 p-3.5 text-white text-xs font-black tracking-wide uppercase truncate text-left">
                    {cat.name}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 w-full scale-x-0 origin-left bg-blue-600 transition-transform duration-300 group-hover:scale-x-100" />
              </button>
            ))}
          </div>
        )}

        {/* Services */}
        {viewMode === 'services' && (
          <div className="space-y-2.5">
            {services.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs font-bold text-slate-400">No services in this category.</p>
              </div>
            ) : services.map(service => {
              const checked = selectedServices.some(s => s.id === service.id);
              return (
                <label
                  key={service.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                    checked ? 'border-blue-500 bg-blue-50/20 shadow-2xs' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 text-left">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onServiceToggle(service)}
                      className="w-4 h-4 accent-blue-600 shrink-0 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1 pl-1">
                      <p className="text-xs font-black text-slate-800 tracking-tight truncate">{service.name}</p>
                      <p className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">{service.duration} min</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black text-slate-900 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md shadow-2xs ml-3 shrink-0">
                    {formatPrice(service.price)}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
      {/* 🛒 RIGHT BLOCK LANE: Floating Shopping Manifest Basket */}
      <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-3.5">
        
        {/* 🌟 ALERT TIER 1: Yellow Warning Pill Tag for Cross-Category Selections [INDEX] */}
        {selectedServices.length > 0 && isCrossCategory && (
          <div className="bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-left shadow-3xs animate-fade-in select-none">
            <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block">⚡ Cross-Sector Bundle Selected</span>
          </div>
        )}

        {selectedServices.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/40 select-none">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">No services selected</span>
            <p className="text-xs font-medium text-slate-400 mx-auto mt-1 leading-normal">
              Choose services from the list to continue.
            </p>
          </div>
        ) : (
          <div className="bg-linear-to-br from-blue-50/50 to-indigo-50/40 border border-blue-100 border-l-4 border-l-blue-600 rounded-2xl p-4 space-y-4 shadow-3xs animate-scale-up">
            <div className="flex items-center justify-between border-b border-blue-100/50 pb-2">
              <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">
                Selected ({selectedServices.length})
              </span>
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center shadow-3xs">
                {selectedServices.length}
              </div>
            </div>

            {/* Dynamic Basket Items List with Interactive Removal Cross Targets */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5 scrollbar-thin">
              {selectedServices.map(s => (
                <div key={s.id} className="flex items-center justify-between text-xs font-semibold text-slate-700 bg-white/70 border border-blue-50/50 p-2 rounded-lg gap-2 group/item">
                  <span className="truncate flex-1 text-left font-bold text-slate-800">{s.name}</span>
                  <span className="font-mono font-black text-slate-900 shrink-0">{formatPrice(s.price)}</span>
                  <button
                    type="button"
                    onClick={() => onServiceToggle(s)}
                    className="text-slate-400 hover:text-rose-600 font-black text-[11px] pl-1 cursor-pointer transition-colors outline-none shrink-0"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-blue-200 space-y-1.5 text-xs">
              <div className="flex justify-between font-bold text-slate-500">
                <span>Duration</span>
                <span className="font-mono text-slate-800 font-black">{totalDuration} min</span>
              </div>
              <div className="flex justify-between items-baseline pt-0.5">
                <span className="font-black text-slate-900">Total</span>
                <span className="text-base font-mono font-black text-blue-600">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {/* 🌟 ADVANCED SELECTION DECODER ACTION GATEWAYS */}
            {checking ? (
              <div className="flex items-center justify-center gap-2 py-2 text-[11px] font-semibold text-slate-400">
                <div className="w-3 h-3 border border-slate-200 border-t-blue-600 rounded-full animate-spin shrink-0" />
                <span>Checking staff availability...</span>
              </div>
            ) : basketStatus === 'unassigned' ? (
              /* 🌟 ALERT TIER 2: Gray Warning Card if a selected service has zero active providers inside your pivot tables [INDEX] */
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-left shadow-2xs animate-fade-in select-none">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">🔒 Service Temporarily Unavailable</p>
                <p className="text-[11px] font-medium text-slate-400 leading-normal">
                  One of the selected services is not currently assigned to any staff member. Please remove it to continue.
                </p>
              </div>
            ) : basketStatus === 'impossible_combination' ? (
              /* 🌟 ALERT TIER 3: Red Blocker Card if individual items exist, but NO single staff member handles both [INDEX] */
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-left shadow-2xs animate-fade-in select-none">
                <p className="text-[10px] font-black text-rose-800 uppercase tracking-wider mb-1">🚫 Combination Impossible</p>
                <p className="text-[11px] font-medium text-rose-700 leading-normal">
                  No single specialist handles this entire combination of services simultaneously. Please check out for these services separately.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={onProceed}
                className="group relative w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-blue-600 font-black tracking-wide uppercase rounded-xl shadow-xs cursor-pointer transition-colors outline-none overflow-hidden"
              >
                <span>Next: Date &amp; Time →</span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
              </button>
            )}

          </div>
        )}
      </div>

    </div>
  );
}

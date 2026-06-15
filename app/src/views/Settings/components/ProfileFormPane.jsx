import React from 'react';

export default function ProfileFormPane({ activeSection, settingsData, onUpdateField, onSave, submitting }) {
  return (
    <div className="flex-1 bg-white p-6 overflow-y-auto flex flex-col font-sans text-left transition-all duration-300">
      <form onSubmit={onSave} className="flex-1 flex flex-col justify-between min-h-0 select-none">
        
        <div className="space-y-5 overflow-y-auto pr-1 flex-1">
          {/* ========================================================
              SECTOR 1: 🏢 SALON PROFILE DETAILS
              ======================================================== */}
          {activeSection === 'profile' && (
            <div className="space-y-4 animate-fade-in text-left">
              <div className="px-0.5 mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Identification Profile</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block pl-0.5">Business Display Name</label>
                <input 
                  type="text" required value={settingsData.business_name || ''} 
                  onChange={e => onUpdateField('business_name', e.target.value)} 
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 block pl-0.5">Primary Support Email</label>
                  <input 
                    type="email" required value={settingsData.business_email || ''} 
                    onChange={e => onUpdateField('business_email', e.target.value)} 
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 block pl-0.5">Contact Phone String</label>
                  <input 
                    type="text" value={settingsData.business_phone || ''} 
                    onChange={e => onUpdateField('business_phone', e.target.value)} 
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block pl-0.5">Currency Base Symbol</label>
                <input 
                  type="text" max="4" value={settingsData.currency_symbol || '$'} 
                  onChange={e => onUpdateField('currency_symbol', e.target.value)} 
                  className="w-24 px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors text-center font-mono" 
                />
              </div>
            </div>
          )}

          {/* ========================================================
              SECTOR 2: ⚙️ LOGIC CONTROLS CONSTRAINTS
              ======================================================== */}
          {activeSection === 'operational' && (
            <div className="space-y-4 animate-fade-in text-left">
              <div className="px-0.5 mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">System Core Booking Constraints</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block pl-0.5">Default Appointment Status</label>
                <select 
                  value={settingsData.default_appointment_status || 'pending'} 
                  onChange={e => onUpdateField('default_appointment_status', e.target.value)}
                  className="w-56 px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="pending">⏳ Hold as Pending (Review)</option>
                  <option value="confirmed">✓ Auto-Approve (Confirmed)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 block pl-0.5">Global Buffer Before (Mins)</label>
                  <input 
                    type="number" min="0" step="5" value={settingsData.global_buffer_before ?? 0} 
                    onChange={e => onUpdateField('global_buffer_before', e.target.value)} 
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-mono" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 block pl-0.5">Global Buffer After (Mins)</label>
                  <input 
                    type="number" min="0" step="5" value={settingsData.global_buffer_after ?? 0} 
                    onChange={e => onUpdateField('global_buffer_after', e.target.value)} 
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-mono" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTOR 3: 🔒 API SECURITY KEYS
              ======================================================== */}
          {activeSection === 'security' && (
            <div className="space-y-4 animate-fade-in text-left">
              <div className="px-0.5 mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">API Verification Tokens</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block pl-0.5">REST API Authorization Guard Secret Token</label>
                <input 
                  type="text" value={settingsData.api_secret_token || ''} 
                  onChange={e => onUpdateField('api_secret_token', e.target.value)} 
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 tracking-wide focus:bg-white transition-colors" 
                />
                <p className="text-[10px] font-semibold text-slate-400 mt-1 leading-relaxed">
                  Secures data stream integrity between outside channels and your customized WordPress repository engine.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 🌟 USER-ORIENTED ACTION BUTTON WITH HOVER UNDERLINE SLIDER */}
        <div className="pt-4 border-t border-slate-100 shrink-0 mt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={submitting}
            className="group relative px-6 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-xs font-black text-blue-600 uppercase tracking-wider cursor-pointer transition-colors outline-none overflow-hidden"
          >
            <span>{submitting ? 'Synchronizing...' : 'Synchronize Configuration'}</span>
            <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
          </button>
        </div>

      </form>
    </div>
  );
}

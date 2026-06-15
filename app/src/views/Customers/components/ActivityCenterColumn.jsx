import React, { useState, useEffect } from 'react';
import AppointmentDetailModal from './AppointmentDetailModal';

export default function ActivityCenterColumn({ customer, appointments = [], onDeleteCustomer, onSaveCustomer }) {
  const [activeTab, setActiveTab]   = useState('timeline');
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');

  useEffect(() => {
    if (customer) {
      setFirstName(customer.first_name || '');
      setLastName(customer.last_name   || '');
      setEmail(customer.email          || '');
      setPhone(customer.phone          || '');
      setActiveTab('timeline');
      setSelectedAppt(null);
    }
  }, [customer]);

  const handleUpdate = (e) => {
    e.preventDefault();
    onSaveCustomer({
      id:         customer.id,
      first_name: firstName.trim(),
      last_name:  lastName.trim()  || null,
      email:      email.trim()     || null,
      phone:      phone.trim()     || null,
    });
  };

  if (!customer) {
    return (
      <div className="flex-1 bg-white p-4 min-w-[400px] flex flex-col font-sans text-left">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 pl-1">Details</span>
        <div className="flex-1 flex items-center justify-center border border-dashed border-slate-100 rounded-xl bg-slate-50/30">
          <p className="text-xs font-bold text-slate-400">Select a customer to view details.</p>
        </div>
      </div>
    );
  }

  // Centralized currency spacing helper
  const currencySymbol = window.igniteSettings?.currency_symbol || '$';
  const formatPrice = (val) => {
    const p = parseFloat(val || 0).toFixed(2);
    return currencySymbol.length > 1 || currencySymbol.includes('.') 
      ? `${currencySymbol} ${p}` 
      : `${currencySymbol}${p}`;
  };

  // Shared tab button style
  const tabBtn = (id, label) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`group relative px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors outline-none overflow-hidden border
        ${activeTab === id
          ? 'bg-blue-50 border-blue-200 text-blue-700'
          : 'bg-slate-50 border-slate-200/60 text-slate-500 hover:bg-slate-100'}`}
    >
      <span>{label}</span>
      <div className={`absolute bottom-0 left-0 right-0 h-[1.5px] origin-left transition-transform duration-200
        ${activeTab === id ? 'bg-blue-600 scale-x-100' : 'bg-blue-600 scale-x-0 group-hover:scale-x-100'}`} />
    </button>
  );

  return (
    <div className="flex-1 bg-white p-4 min-w-[450px] overflow-y-auto flex flex-col font-sans text-left">

      {/* Tab bar + delete */}
      <div className="flex items-center justify-between mb-4 px-1 shrink-0 select-none">
        <div className="flex items-center gap-2">
          {tabBtn('timeline', 'Timeline')}
          {tabBtn('profile',  'Edit Profile')}
        </div>
        <button
          type="button"
          onClick={() => onDeleteCustomer(customer.id)}
          className="group relative px-3 py-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200/60 rounded-md text-[10px] font-black text-rose-500 uppercase tracking-wider cursor-pointer transition-colors outline-none overflow-hidden"
        >
          <span>Delete</span>
          <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-rose-500 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
        </button>
      </div>

      <div className="space-y-4 flex-1 flex flex-col select-none">

        {/* Customer name + ID */}
        <div className="px-1 shrink-0">
          <h3 className="text-sm font-black text-slate-900 tracking-tight">{customer.first_name} {customer.last_name || ''}</h3>
          <span className="text-[10px] font-mono font-bold text-slate-400 block mt-0.5">ID #{customer.id}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Visits</span>
            <span className="text-lg font-mono font-black text-slate-800 block mt-0.5">{customer.total_appointments || 0}</span>
          </div>
          <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Spent</span>
            {/* 🌟 USER REFACTOR FIXED: Formats total spent beautifully according to settings selection */}
            <span className="text-lg font-mono font-black text-slate-900 block mt-0.5">
              {formatPrice(customer.total_spent)}
            </span>
          </div>
        </div>

        {/* Timeline tab */}
        {activeTab === 'timeline' && (
          <div className="flex-1 flex flex-col min-h-0">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1 mb-2 shrink-0">Appointment History</span>
            {appointments.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6 border border-dashed border-slate-100 rounded-xl bg-slate-50/20">
                <p className="text-xs font-semibold text-slate-400 text-center">No appointments on record.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl bg-white shadow-2xs">
                {appointments.map(appt => (
                  <div
                    key={appt.id}
                    onClick={() => setSelectedAppt(appt)}
                    className="group relative p-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  >
                    <span className="text-xs font-black text-slate-800 truncate group-hover:text-blue-600 transition-colors flex-1 text-left">
                      {appt.employee_name || 'Specialist'}
                    </span>
                    <div className="shrink-0 flex items-center gap-4 font-mono text-xs font-bold text-slate-600">
                      <span>{appt.booking_date}</span>
                      <span className="text-slate-400 font-medium">{String(appt.booking_time || '00:00').substring(0, 5)}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Profile edit tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdate} className="flex-1 flex flex-col justify-between min-h-0 animate-scale-up">
            <div className="space-y-3.5 overflow-y-auto pr-0.5 text-left">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">Edit Details</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 pl-0.5">First Name</label>
                  <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 pl-0.5">Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 pl-0.5">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 pl-0.5">Phone Number</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
              </div>
            </div>
            <button type="submit" className="group relative w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-[11px] font-black text-blue-600 uppercase tracking-wide cursor-pointer transition-colors outline-none overflow-hidden">
              <span>Save Changes</span>
              <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
            </button>
          </form>
        )}

      </div>

      <AppointmentDetailModal appointment={selectedAppt} onClose={() => setSelectedAppt(null)} />
    </div>
  );
}

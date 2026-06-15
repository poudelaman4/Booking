import React, { useState } from 'react';

export default function CustomerListColumn({ customers = [], selectedCustomer, onSelectCustomer, onSaveCustomer }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstName.trim()) return;
    onSaveCustomer({
      first_name: firstName.trim(),
      last_name:  lastName.trim()  || null,
      email:      email.trim()     || null,
      phone:      phone.trim()     || null,
      timezone:   'UTC',
    });
    setFirstName(''); setLastName(''); setEmail(''); setPhone('');
    setShowAddForm(false);
  };

  return (
    <div className="w-72 border-r border-slate-100 bg-slate-50/20 p-4 shrink-0 flex flex-col gap-2 overflow-y-auto font-sans text-left">

      {/* Header */}
      <div className="flex items-center justify-between mb-1 px-1 shrink-0 select-none">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clients</span>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className={`group relative px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-md text-[9px] font-black uppercase tracking-wider cursor-pointer transition-colors outline-none overflow-hidden ${showAddForm ? 'text-rose-500' : 'text-blue-600'}`}
        >
          <span>{showAddForm ? 'Cancel' : '+ Add Client'}</span>
          <div className={`absolute bottom-0 left-0 right-0 h-[1.5px] scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100 ${showAddForm ? 'bg-rose-500' : 'bg-blue-600'}`} />
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-3 rounded-xl space-y-2.5 animate-scale-up shrink-0">
          <input type="text"  required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name *"    className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 transition-colors" />
          <input type="text"           value={lastName}  onChange={e => setLastName(e.target.value)}  placeholder="Last Name"       className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 transition-colors" />
          <input type="email"          value={email}     onChange={e => setEmail(e.target.value)}     placeholder="Email Address"   className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 transition-colors" />
          <input type="text"           value={phone}     onChange={e => setPhone(e.target.value)}     placeholder="Phone Number"    className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 transition-colors" />
          <button type="submit" className="group relative w-full py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-md text-[10px] font-black text-blue-600 uppercase tracking-wider cursor-pointer transition-colors outline-none overflow-hidden">
            <span>Add Customer</span>
            <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
          </button>
        </form>
      )}

      {/* List */}
      <div className="flex-1 space-y-1 overflow-y-auto">
        {customers.length === 0 && (
          <p className="text-[11px] text-slate-400 font-semibold text-center py-8">No customers found.</p>
        )}
        {customers.map(cust => {
          const isSelected = selectedCustomer && String(selectedCustomer.id) === String(cust.id);
          const initial = cust.first_name ? cust.first_name.charAt(0).toUpperCase() : '?';
          return (
            <div
              key={cust.id}
              onClick={() => onSelectCustomer(cust)}
              className={`group relative w-full px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 flex items-center justify-between gap-3
                ${isSelected ? 'bg-slate-50 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50/60 hover:text-slate-900 font-semibold'}`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono text-[9px] font-black flex items-center justify-center uppercase border border-slate-300/40 shrink-0">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs tracking-tight block truncate">{cust.first_name} {cust.last_name || ''}</span>
                  {(cust.email || cust.phone) && (
                    <span className="text-[10px] text-slate-400 font-medium block truncate mt-0.5">{cust.email || cust.phone}</span>
                  )}
                </div>
              </div>
              {/* 🌟 USER REFACTOR FIXED: Swapped hardcoded '$' with dynamic window settings variable! [INDEX] */}
              <span className="shrink-0 text-[10px] font-mono font-black text-slate-900 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                {window.igniteSettings?.currency_symbol || '$'}{parseFloat(cust.total_spent || 0).toFixed(2)}
              </span>
              <div className="absolute bottom-0 left-3.5 right-3.5 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
            </div>
          );
        })}
      </div>

    </div>
  );
}

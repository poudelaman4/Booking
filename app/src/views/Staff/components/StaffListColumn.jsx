import React, { useState } from 'react';
import { apiClient } from '../../../api/client';

// ─── Modal backdrop + card wrapper ───────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 animate-scale-up font-sans"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Shared styled input ──────────────────────────────────────────────────────
function Field({ type = 'text', value, onChange, placeholder, required }) {
  return (
    <input
      type={type}
      required={required}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors placeholder-slate-400"
    />
  );
}

// ─── Add Staff Modal ──────────────────────────────────────────────────────────
function AddStaffModal({ onClose, onCreated }) {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim()) { setError('First name is required.'); return; }
    if (!email.trim())      { setError('Email address is required.'); return; }
    if (password.length < 4){ setError('Password must be at least 4 characters.'); return; }

    setSaving(true);
    try {
      await apiClient.request('employees', {
        method: 'POST',
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name:  lastName.trim() || null,
          email:      email.trim(),
          password,
          is_active:  1,
        }),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Staff Member" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" required />
          <Field value={lastName}  onChange={e => setLastName(e.target.value)}  placeholder="Last name" />
        </div>
        <Field type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (used to log in)" required />
        <Field type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Initial password" required />

        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
          The email address becomes their WordPress login username. You set the password — they can use it right away.
        </p>

        {error && (
          <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-black rounded-lg transition-colors cursor-pointer tracking-tight"
        >
          {saving ? 'Creating account…' : 'Create Staff Account'}
        </button>
      </form>
    </Modal>
  );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ emp, onClose, onDone }) {
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const fullName = `${emp.first_name} ${emp.last_name || ''}`.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 4)    { setError('Password must be at least 4 characters.'); return; }
    if (password !== confirm)    { setError('Passwords do not match.'); return; }

    setSaving(true);
    try {
      await apiClient.request(`employees/${emp.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      onDone();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Reset Password — ${fullName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          Set a new login password for <span className="font-bold text-slate-700">{fullName}</span>. Their current session will be signed out immediately.
        </p>

        <Field type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" required />
        <Field type="password" value={confirm}  onChange={e => setConfirm(e.target.value)}  placeholder="Confirm new password" required />

        {error && (
          <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-black rounded-lg transition-colors cursor-pointer tracking-tight"
        >
          {saving ? 'Saving…' : 'Update Password'}
        </button>
      </form>
    </Modal>
  );
}

// ─── Main column ─────────────────────────────────────────────────────────────
export default function StaffListColumn({ employees = [], selectedEmp, onSelect, onRefreshData }) {
  const [showAddModal,      setShowAddModal]      = useState(false);
  const [resetTarget,       setResetTarget]       = useState(null); // employee object to reset

  const handleCreated = () => {
    if (onRefreshData) onRefreshData();
  };

  const handlePasswordUpdated = () => {
    // Could show a toast — parent can extend this via a prop if desired
  };

  return (
    <>
      <div className="w-64 border-r border-slate-100 bg-slate-50/20 p-4 shrink-0 space-y-1.5 overflow-y-auto relative flex flex-col text-left font-sans">

        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1 shrink-0 select-none">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Team</span>
          <button
            onClick={() => setShowAddModal(true)}
            className="group relative px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-md text-[9px] font-black text-blue-600 uppercase tracking-wider cursor-pointer transition-colors outline-none overflow-hidden"
          >
            <span>+ Add Staff</span>
            <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
          </button>
        </div>

        {/* Staff list */}
        <div className="flex-1 space-y-1.5 overflow-y-auto">
          {employees.length === 0 ? (
            <p className="text-xs font-medium text-slate-400 p-2">No staff members yet.</p>
          ) : (
            employees.map(emp => {
              const isSelected = selectedEmp && String(selectedEmp.id) === String(emp.id);
              const initial = emp.first_name ? emp.first_name.charAt(0).toUpperCase() : 'S';

              return (
                <div
                  key={emp.id}
                  className={`group relative w-full px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 flex items-center gap-2.5 ${isSelected ? 'bg-slate-50 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50/60 hover:text-slate-900 font-semibold'}`}
                >
                  {/* Avatar — clicking selects the employee */}
                  <div
                    onClick={() => onSelect(emp)}
                    className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[9px] font-black flex items-center justify-center uppercase overflow-hidden border shrink-0"
                  >
                    {emp.avatar_url ? <img src={emp.avatar_url} className="w-full h-full object-cover" alt="" /> : initial}
                  </div>

                  {/* Name + email — clicking selects the employee */}
                  <div className="min-w-0 flex-1 text-left" onClick={() => onSelect(emp)}>
                    <span className="text-xs tracking-tight block truncate">{emp.first_name} {emp.last_name || ''}</span>
                    {emp.email && <span className="text-[10px] text-slate-400 font-medium block truncate mt-0.5">{emp.email}</span>}
                  </div>

                  {/* Reset password button — appears on hover */}
                  <button
                    onClick={e => { e.stopPropagation(); setResetTarget(emp); }}
                    title="Reset password"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {/* key icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M9.504 1.132a1 1 0 0 1 .992.28l3.092 3.092a1 1 0 0 1 .28.992l-.757 2.271a1 1 0 0 1-.25.405l-5.051 5.05a1 1 0 0 1-1.414 0l-3.536-3.535a1 1 0 0 1 0-1.414l5.05-5.051a1 1 0 0 1 .405-.25l2.189-.84ZM12 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                      <path d="M4.5 12.5 3 14H1.5L1 13.5V12l1.5-1.5 2 2Z" />
                    </svg>
                  </button>

                  <div className="absolute bottom-0 left-3.5 right-3.5 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals — rendered outside the column so they're truly fullscreen */}
      {showAddModal && (
        <AddStaffModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleCreated}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          emp={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={handlePasswordUpdated}
        />
      )}
    </>
  );
}
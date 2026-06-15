import React, { useEffect, useState, useCallback, useRef } from 'react';
import { apiClient } from '../../../api/client';

/**
 * StaffAndTimes — alternate staff+slot picker.
 * Not used in the current booking flow (which uses DateTimeStep + AvailableStaffStep).
 * Kept for reference / future use.
 */
export default function StaffAndTimes({ serviceId, date, totalDuration, onSelectSlot }) {
  const [staffList, setStaffList]   = useState([]);
  const [activeStaff, setActiveStaff] = useState(null);
  const [slots, setSlots]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const staffFetched                = useRef(false);

  useEffect(() => {
    if (staffFetched.current) return;
    setLoading(true);
    apiClient.request('employees')
      .then(res => {
        const list = Array.isArray(res) ? res : [];
        setStaffList(list);
        if (list.length > 0) setActiveStaff(list[0]);
      })
      .catch(() => setError('Failed to load staff.'))
      .finally(() => { setLoading(false); staffFetched.current = true; });
  }, []);

  useEffect(() => {
    if (!activeStaff?.id || !date) { setSlots([]); return; }
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      apiClient.request(`appointments/slots?employee_id=${activeStaff.id}&service_id=${serviceId || 0}&date=${date}&duration=${totalDuration}`)
        .then(res => setSlots(Array.isArray(res) ? res : []))
        .catch(() => { setError('Failed to load available times.'); setSlots([]); })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [activeStaff?.id, date, serviceId, totalDuration]);

  const formatTime = (ts) => {
    try { const p = ts.split(' '); return (p[1] || ts).slice(0, 5); }
    catch { return ts; }
  };

  return (
    <div className="ignite-step-content">

      {/* Staff picker */}
      <div className="ignite-field-group">
        <label className="ignite-label">Select a staff member</label>
        {staffList.length === 0 ? (
          <p className="ignite-empty">No staff available.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {staffList.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStaff(s)}
                className={activeStaff?.id === s.id ? 'ignite-btn-primary ignite-btn-sm' : 'ignite-back-btn'}
              >
                {s.first_name}{s.title ? ` · ${s.title}` : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Time slots */}
      <div className="ignite-field-group">
        <label className="ignite-label">Select a time</label>
        {loading ? (
          <div className="ignite-loading"><div className="ignite-spinner" /><p>Loading times...</p></div>
        ) : error ? (
          <div className="ignite-alert-error">{error}</div>
        ) : slots.length === 0 ? (
          <div className="ignite-empty-box"><p>No available times.</p><span>Try a different date or staff member.</span></div>
        ) : (
          <div className="ignite-time-grid">
            {slots.map((slot, i) => (
              <button key={i} type="button" className="ignite-time-btn" onClick={() => activeStaff && onSelectSlot(activeStaff.id, slot)}>
                {formatTime(slot.start)}
              </button>
            ))}
          </div>
        )}
      </div>

      {totalDuration > 0 && (
        <div className="ignite-alert-error" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
          Appointment duration: {totalDuration} minutes
        </div>
      )}
    </div>
  );
}
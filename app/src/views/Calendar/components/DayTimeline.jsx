import React, { useState, useMemo, useRef } from 'react';
import AppointmentBlock from './AppointmentBlock';
import AppointmentModal from './AppointmentModal';

const START_HOUR = 0;
const END_HOUR = 24;
const PIXELS_PER_MINUTE = 1.1; 
const ROW_HEIGHT = 60 * PIXELS_PER_MINUTE;
const TOTAL_GRID_HEIGHT = (END_HOUR - START_HOUR) * ROW_HEIGHT;

function parseMinutes(timeStr) {
  if (!timeStr) return 0;
  const time = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
  const segments = time.split(':');
  if (segments.length < 2) return 0;
  return (parseInt(segments[0], 10) * 60) + parseInt(segments[1], 10);
}

export default function DayTimeline({ appointments = [], employees = [] }) {
  const [activeModal, setActiveModal] = useState(null);
  const [sortOrder, setSortOrder] = useState('volume');
  
  const scrollContainerRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Algorithmic Booking Volume Sorting Matrix
  const sortedEmployees = useMemo(() => {
    if (!Array.isArray(employees)) return [];
    const rosterCopy = [...employees];

    if (sortOrder === 'volume') {
      const countMap = {};
      rosterCopy.forEach(emp => {
        countMap[emp.id] = appointments.filter(
          a => String(a.employee_id) === String(emp.id)
        ).length;
      });
      return rosterCopy.sort((a, b) => (countMap[b.id] || 0) - (countMap[a.id] || 0));
    }

    if (sortOrder === 'alphabetical') {
      return rosterCopy.sort((a, b) => {
        const nameA = (a.first_name || '').toLowerCase();
        const nameB = (b.first_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }

    return rosterCopy;
  }, [employees, appointments, sortOrder]);

  // Mouse Drag-to-Scroll Configuration Handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.cursor-pointer') || e.target.closest('select') || e.target.closest('button')) return;
    setIsMouseDown(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walkX = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walkX;
  };

  const handleMouseUpOrLeave = () => {
    setIsMouseDown(false);
  };

  // Parallel Overlap Math Style Reducer
  const computeParallelLayoutStyles = (laneAppointments) => {
    const sorted = [...laneAppointments].sort((a, b) => parseMinutes(a.start_time) - parseMinutes(b.start_time));
    const layoutStylesMap = {};

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const curStart = parseMinutes(current.start_time);
      const curEnd = parseMinutes(current.end_time);

      let isOverlapping = false;
      let overlapIndex = 0;

      for (let j = 0; j < sorted.length; j++) {
        if (i === j) continue;
        const other = sorted[j];
        const othStart = parseMinutes(other.start_time);
        const othEnd = parseMinutes(other.end_time);

        if (curStart < othEnd && curEnd > othStart) {
          isOverlapping = true;
          if (i > j) overlapIndex++;
        }
      }

      if (isOverlapping) {
        layoutStylesMap[current.id] = {
          width: '44%',
          left: overlapIndex % 2 === 0 ? '4%' : '48%'
        };
      } else {
        layoutStylesMap[current.id] = {
          width: 'calc(100% - 24px)',
          left: '12px'
        };
      }
    }
    return layoutStylesMap;
  };

  const columnCount = sortedEmployees.length;
  const laneGridStyle = { gridTemplateColumns: `repeat(${columnCount}, minmax(240px, 1fr))` };

  return (
    <div className="w-full border border-slate-200 rounded-xl bg-white shadow-xs select-none font-sans overflow-hidden animate-fade-in flex flex-col relative isolation-auto">
      {/* Control Configuration Header Toolbar */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-4 z-50 relative">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Staff Schedule Matrix</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort Configuration:</span>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-md outline-none cursor-pointer hover:border-slate-300 transition-colors"
          >
            <option value="volume">Active Booking Volume (Busiest First)</option>
            <option value="alphabetical">Alphabetical Roster Order</option>
          </select>
        </div>
      </div>

      {/* Main Dual-Axis Viewport Scroll Container */}
      <div 
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`w-full overflow-x-auto scrollbar-thin select-none max-h-150 overflow-y-auto relative ${isMouseDown ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div className="min-w-max flex flex-col relative" style={{ minWidth: `${64 + (Math.max(columnCount, 1) * 240)}px` }}>
          {/* ============================================
              🔒 STICKY TOP ROW HEADER: STAFF COLUMNS BANNERS
              ============================================ */}
          <div className="flex sticky top-0 z-40 bg-slate-50 border-b border-slate-100">
            
            {/* 🌟 SOLID CORNER SHIELD: High Z-index ensures the intersection stays immune to bleeding */}
            <div className="w-16 border-r border-slate-100 bg-slate-50 sticky left-0 z-50 shrink-0" />
            
            {/* Staff Headers Channels List Grid */}
            <div className="grow grid divide-x divide-slate-100 bg-slate-50" style={laneGridStyle}>
              {sortedEmployees.map(staff => {
                const dayCount = appointments.filter(a => String(a.employee_id) === String(staff.id)).length;
                return (
                  <div key={staff.id} className="px-4 py-3 flex items-center justify-between gap-3 min-w-0 bg-slate-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-black flex items-center justify-center uppercase overflow-hidden border shrink-0">
                        {staff.avatar_url ? <img src={staff.avatar_url} className="w-full h-full object-cover" alt="" /> : staff.first_name.charAt(0)}
                      </div>
                      <span className="text-xs font-black text-slate-800 tracking-tight truncate">
                        {staff.first_name} {staff.last_name || ''}
                      </span>
                    </div>
                    {dayCount > 0 && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md shrink-0 uppercase tracking-wide">
                        {dayCount} {dayCount === 1 ? 'Booking' : 'Bookings'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================
              🔒 STICKY LEFT TIMELINE COLUMN + CANVAS
              ============================================ */}
          <div className="flex relative bg-white" style={{ height: TOTAL_GRID_HEIGHT }}>
            
            {/* 🌟 SOLID TIME LABELS AXIS: Crisp white background handles sidebar masking with zero clipping bleed */}
            <div
              className="w-16 border-r border-slate-200 bg-white text-slate-400 sticky left-0 z-30 shrink-0 shadow-[1px_0_3px_rgba(15,23,42,0.03)]"
              style={{ height: TOTAL_GRID_HEIGHT }}
            >
              {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-3 text-[10px] font-mono font-bold text-slate-400 select-none pt-1.5"
                  style={{ top: i * ROW_HEIGHT }}
                >
                  {String(START_HOUR + i).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Main Interactive Matrix Tracks Grid */}
            <div className="grow grid divide-x divide-slate-100 relative bg-white z-10" style={laneGridStyle}>
              {sortedEmployees.map(staff => {
                const laneAppointments = appointments.filter(a => String(a.employee_id) === String(staff.id));
                const dynamicStyles = computeParallelLayoutStyles(laneAppointments);

                return (
                  <div key={staff.id} className="relative bg-white" style={{ height: TOTAL_GRID_HEIGHT }}>
                    
                    {/* Background hour split lines */}
                    {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute left-0 right-0 border-t border-slate-100 pointer-events-none"
                        style={{ top: i * ROW_HEIGHT }}
                      />
                    ))}

                    {/* Render Parallel Appointment Token Blocks */}
                    {laneAppointments.map(appt => {
                      const startMin = parseMinutes(appt.start_time);
                      const endMin = parseMinutes(appt.end_time);
                      const topOffset = startMin * PIXELS_PER_MINUTE;
                      const blockHeight = Math.max((endMin - startMin) * PIXELS_PER_MINUTE, 34);

                      if (topOffset < 0 || topOffset >= TOTAL_GRID_HEIGHT) return null;

                      const styleOverride = dynamicStyles[appt.id] || { width: 'calc(100% - 24px)', left: '12px' };

                      return (
                        <AppointmentBlock
                          key={appt.id}
                          appointment={appt}
                          topOffset={topOffset}
                          blockHeight={blockHeight}
                          widthOverride={styleOverride.width}
                          leftOverride={styleOverride.left}
                          onOpenModal={setActiveModal}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      <AppointmentModal activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}

import React, { useState } from 'react';
import Button from '../../../components/ui/Button';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarHeader({
  selectedDate,
  currentYear,
  currentMonth,
  searchQuery,
  filteredEmployees,
  onYearChange,
  onMonthChange,
  onSearchChange,
  onSelectStaff,
  onBack,
  onSetToday,
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      onMonthChange(11);
      onYearChange(prev => prev - 1);
    } else {
      onMonthChange(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      onMonthChange(0);
      onYearChange(prev => prev + 1);
    } else {
      onMonthChange(currentMonth + 1);
    }
  };

  return (
    <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none font-sans relative">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
          {selectedDate ? `Schedule: ${selectedDate}` : 'Shop Calendar'}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 self-start md:self-center z-40">
        
        {/* PREDICTIVE SEARCH FILTER CONTAINER PANEL */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 250)} // Added a small extra buffer to capture option clicks safely [INDEX]
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search staff..."
            className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 bg-white rounded-lg outline-none w-56 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder-slate-400"
          />

          {showDropdown && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50 divide-y divide-slate-50 scrollbar-thin">
              {filteredEmployees.length === 0 ? (
                <div className="p-3 text-center text-[11px] text-slate-400 font-medium">No matching staff member found</div>
              ) : (
                filteredEmployees.slice(0, 5).map(staff => {
                  const staffFullName = `${staff.first_name} ${staff.last_name || ''}`.trim();
                  return (
                    <div
                      key={staff.id}
                      onClick={() => {
                        // 🧠 FIXED: Updates only the string input text query. It never forces date changes! [INDEX]
                        onSelectStaff(staffFullName);
                        setShowDropdown(false);
                      }}
                      className="px-3 py-2 flex items-center gap-2.5 hover:bg-blue-50/40 cursor-pointer transition-colors text-left"
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[9px] font-black flex items-center justify-center uppercase overflow-hidden border shrink-0">
                        {staff.avatar_url ? <img src={staff.avatar_url} className="w-full h-full object-cover" alt="" /> : staff.first_name.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {staffFullName}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {selectedDate ? (
          <Button variant="secondary" size="sm" onClick={onBack}>
            ← Back to Month
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrevMonth}>◀</Button>
            <div className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-700 text-center min-w-23.75">
              {MONTH_NAMES[currentMonth]}
            </div>
            <Button variant="secondary" size="sm" onClick={handleNextMonth}>▶</Button>

            <select
              value={currentYear}
              onChange={e => onYearChange(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg outline-none cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>

            <Button variant="secondary" size="sm" onClick={onSetToday}>Today</Button>
          </div>
        )}
      </div>
    </div>
  );
}

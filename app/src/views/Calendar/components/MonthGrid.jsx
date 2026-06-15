import React, { useMemo } from 'react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MonthGrid({ appointments = [], year, month, onSelectDay }) {
  
  const { gridCells, todayStr } = useMemo(() => {
    const today = new Date();
    const tY = today.getFullYear();
    const tM = String(today.getMonth() + 1).padStart(2, '0');
    const tD = String(today.getDate()).padStart(2, '0');
    const currentTodayStr = `${tY}-${tM}-${tD}`;

    const cells = [];
    
    // 🧠 PADDING CALCULATOR: Find which weekday column the 1st of the month lands on
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    // Insert empty padding spacer slots so the 1st aligns perfectly beneath its weekday header
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ isPadding: true });
    }

    const cursor = new Date(year, month, 1);
    while (cursor.getMonth() === month) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');
      const dateString = `${y}-${m}-${d}`;

      const count = appointments.filter(
        a => a.start_time?.split(' ')[0] === dateString
      ).length;

      const isToday = currentTodayStr === dateString;

      cells.push({
        isPadding: false,
        dateString,
        dayNum: cursor.getDate(),
        count,
        isToday,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return { gridCells: cells, todayStr: currentTodayStr };
  }, [appointments, year, month]);
  return (
    <div className="space-y-3 font-sans text-left animate-fade-in select-none">
      
      {/* 📅 TOP ROW TRACK: Strict 7-Column Day Header Row Matrix */}
      <div className="grid grid-cols-7 gap-2 border-b border-slate-100 pb-2 text-center">
        {WEEKDAYS.map(day => (
          <span key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-widest block py-0.5">
            {day}
          </span>
        ))}
      </div>

      {/* 📊 MASTER MONTH GRID MESH MAP: Constrained to clean grid-cols-7 grids */}
      <div className="grid grid-cols-7 gap-2">
        {gridCells.map((cell, i) => {
          if (cell.isPadding) {
            return (
              <div 
                key={`pad-${i}`} 
                className="bg-slate-50/30 border border-slate-100/40 rounded-xl min-h-24 opacity-40 pointer-events-none" 
              />
            );
          }

          return (
            <div
              key={`day-${cell.dateString}`}
              onClick={() => onSelectDay(cell.dateString)}
              className={`
                group cursor-pointer p-3 bg-white border rounded-xl relative flex flex-col justify-between min-h-24 transition-all duration-200 hover:border-blue-500 hover:shadow-2xs
                ${cell.isToday ? 'border-blue-500 bg-blue-50/5 ring-2 ring-blue-100/50' : 'border-slate-200/80'}
              `}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-black font-mono ${cell.isToday ? 'text-blue-600' : 'text-slate-800'}`}>
                  {cell.dayNum}
                </span>
                {cell.isToday && (
                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-1 py-0.5 rounded-sm">
                    Today
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 mt-auto pt-2">
                {cell.count > 0 ? (
                  <span className={`inline-block text-[9px] font-black uppercase tracking-wider text-center py-1 rounded-md border w-full truncate px-1
                    ${cell.isToday 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-3xs' 
                      : 'bg-slate-900 border-slate-900 text-white shadow-3xs'}`}
                  >
                    {cell.count} {cell.count === 1 ? 'Book' : 'Books'}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-slate-300 block uppercase tracking-wider pl-0.5 select-none">
                    Empty
                  </span>
                )}
              </div>

              {/* Slider highlighter interaction accent row */}
              <div className="absolute bottom-0 left-3.5 right-3.5 h-[1.5px] scale-x-0 origin-left bg-blue-600 transition-transform duration-300 group-hover:scale-x-100" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

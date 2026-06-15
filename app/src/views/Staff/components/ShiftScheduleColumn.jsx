import React from 'react';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ShiftScheduleColumn({ schedule = [], isActiveSelected, staffName, onUpdateField, onSave }) {

  const handleTimeChange = (dayIdx, fieldKey, timeValue) => {
    const formattedTime = timeValue.length === 5 ? `${timeValue}:00` : timeValue;
    onUpdateField(dayIdx, fieldKey, formattedTime);
  };

  return (
    <div className="w-110 border-r border-slate-100 bg-white p-4 shrink-0 space-y-1.5 overflow-y-auto flex flex-col text-left font-sans transition-all duration-300">
      
      {/* 🌟 UPGRADED HEADER WITH HOVER-SLIDING ACTION BUTTON */}
      <div className="flex items-center justify-between mb-3 px-1 shrink-0 select-none">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weekly Schedule</span>
        {isActiveSelected && (
          <button 
            onClick={onSave}
            className="group relative px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg text-[10px] font-black text-emerald-600 uppercase tracking-wider cursor-pointer transition-colors outline-none overflow-hidden"
          >
            <span>Save Hours</span>
            {/* Signature Token: Sliding left-to-right blue highlight micro line on hover */}
            <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-green-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
          </button>
        )}
      </div>

      {!isActiveSelected ? (
        <div className="flex-1 flex items-center justify-center p-4 border border-dashed border-slate-100 rounded-xl bg-slate-50/20">
          <p className="text-xs font-semibold text-slate-400 text-center leading-relaxed">Select a staff member from the roster to inspect shift timelines.</p>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1 flex flex-col">
          <div className="px-1 mb-1 shrink-0">
            <h4 className="text-xs font-black text-slate-800 tracking-tight truncate">Hours for {staffName}</h4>
          </div>
          
          {/* 🌟 CLEANED: Giant bottom button deleted, list now takes up full smooth scrollable heights tracks */}
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {schedule.map(sched => {
              const isDayOff = parseInt(sched.is_day_off, 10) === 1;
              const cleanStart = String(sched.start_time || '09:00:00').substring(0, 5);
              const cleanEnd = String(sched.end_time || '17:00:00').substring(0, 5);

              return (
                <div key={sched.day_of_week} className="group relative p-3 bg-slate-50/40 border border-slate-100 rounded-xl flex items-center justify-between gap-4 transition-colors hover:bg-slate-50/80">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      onClick={() => onUpdateField(sched.day_of_week, 'is_day_off', isDayOff ? 0 : 1)}
                      className="w-3.5 h-3.5 rounded-full border flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                      style={{ borderColor: !isDayOff ? '#2563eb' : '#cbd5e1', backgroundColor: !isDayOff ? '#2563eb' : '#ffffff' }}
                    >
                      {!isDayOff && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={`text-xs tracking-tight truncate ${!isDayOff ? 'font-bold text-slate-800' : 'font-medium text-slate-400'}`}>
                      {DAYS_OF_WEEK[sched.day_of_week]}
                    </span>
                  </div>

                  {!isDayOff ? (
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-700 shrink-0">
                      <input 
                        type="time" value={cleanStart} onChange={e => handleTimeChange(sched.day_of_week, 'start_time', e.target.value)}
                        className="bg-white border border-slate-200 rounded-md px-3 py-1.5 outline-none text-center w-26.25 cursor-ew-resize focus:border-blue-500 font-mono text-xs"
                      />
                      <span className="text-slate-300 font-normal mx-0.5 font-sans">→</span>
                      <input 
                        type="time" value={cleanEnd} onChange={e => handleTimeChange(sched.day_of_week, 'end_time', e.target.value)}
                        className="bg-white border border-slate-200 rounded-md px-3 py-1.5 outline-none text-center w-26.25 cursor-ew-resize focus:border-blue-500 font-mono text-xs"
                      />
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-slate-300 pr-14 shrink-0 select-none">
                      --:-- → --:--
                    </span>
                  )}
                  
                  <div className="absolute bottom-0 left-3.5 right-3.5 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

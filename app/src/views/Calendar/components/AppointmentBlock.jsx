import React from 'react';

export default function AppointmentBlock({ 
  appointment, topOffset, blockHeight, widthOverride, leftOverride, onOpenModal 
}) {
  
  // 🧠 TIME ISOLATION ENGINE: Strips away dates and extracts pure 5-character intervals (HH:MM)
  const extractCleanTime = (timeString) => {
    if (!timeString) return '--:--';
    // If the database gives us '2026-06-15 09:45:00', pick the time element cleanly [INDEX]
    const parts = timeString.split(' ');
    const timeNode = parts.length > 1 ? parts[1] : parts[0];
    return timeNode.substring(0, 5); // Returns exactly '09:45'
  };

  const startTimeLabel = extractCleanTime(appointment.start_time);
  const endTimeLabel = extractCleanTime(appointment.end_time);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation(); // 🛡️ Standalone event block safety lock
        onOpenModal(appointment);
      }}
      className="absolute bg-white border border-slate-200/90 rounded-lg p-2.5 shadow-[0_2px_4px_rgba(15,23,42,0.02)] cursor-pointer select-none overflow-hidden transition-all duration-150 hover:border-blue-500 hover:shadow-sm group z-20 flex flex-col justify-center"
      style={{ 
        top: topOffset, 
        height: blockHeight,
        width: widthOverride || 'calc(100% - 24px)', 
        left: leftOverride || '12px' 
      }}
    >
      <div className="w-full text-left min-w-0 font-sans">
        {/* 1. Main Title Text Line */}
        <span className="text-[11px] font-black text-slate-800 block truncate group-hover:text-blue-600 transition-colors leading-tight">
          Appt #{appointment.id}
        </span>
        
        {/* 2. Micro 5-Character Time Frame Interval Window Block */}
        <span className="text-[10px] font-mono font-bold text-slate-400 block mt-1 leading-none tracking-tight">
          {startTimeLabel} <span className="text-slate-300 font-sans font-normal mx-0.5">→</span> {endTimeLabel}
        </span>
      </div>

      {/* Slide-in blue accent indicator bar on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] w-full scale-x-0 origin-left bg-blue-600 transition-transform duration-200 group-hover:scale-x-100" />
    </div>
  );
}

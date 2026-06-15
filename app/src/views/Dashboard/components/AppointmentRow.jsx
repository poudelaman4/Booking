import React from 'react';

const STATUS = {
  confirmed: 'text-slate-600',
  pending: 'text-slate-500',
  cancelled: 'text-slate-400',
};

export default function AppointmentRow({
  start,
  end,
  price,
  status,
  serviceName,
  employeeName,
}) {
  // Safe time extractor (handles MySQL datetime)
  const formatTime = (t) => {
    if (!t) return '--:--';
    const parts = t.split(' ');
    const raw = parts[1] || parts[0];
    return raw.substring(0, 5);
  };

  const statusClass = STATUS[status] || 'text-slate-500';

  return (
    <div
      className="
        group relative flex items-center justify-between
        px-5 py-4
        border-b border-slate-100
        transition-colors duration-200
      "
    >

      {/* LEFT SIDE */}
      <div className="flex flex-col gap-1 min-w-0">

        {/* TIME (single clean line) */}
        <div className="text-sm font-mono font-bold text-slate-900 tracking-tight">
          {formatTime(start)}
          <span className="mx-2 text-slate-300 font-sans">→</span>
          <span className="text-slate-500 font-medium">
            {formatTime(end)}
          </span>
        </div>

        {/* SERVICE NAME */}
        <div className="text-sm font-semibold text-slate-900 truncate">
          {serviceName}
        </div>

        {/* EMPLOYEE */}
        {employeeName && (
          <div className="text-xs text-slate-500 truncate">
            {employeeName}
          </div>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-5 shrink-0">

        {/* PRICE */}
        <div className="text-sm font-black text-slate-900">
          ${parseFloat(price || 0).toFixed(2)}
        </div>

        {/* STATUS */}
        <div className={`text-xs uppercase font-bold tracking-wider ${statusClass}`}>
          {status}
        </div>

      </div>

      {/* 🔵 ONLY ACCENT ELEMENT: LEFT → RIGHT HOVER LINE */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
        <div
          className="
            h-full w-0
            bg-blue-600
            transition-all duration-300 ease-out
            group-hover:w-full
          "
        />
      </div>
    </div>
  );
}
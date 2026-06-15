import React from 'react';

const BADGE = {
  emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  blue: 'text-blue-700 bg-blue-50 border-blue-100',
  purple: 'text-purple-700 bg-purple-50 border-purple-100',
  indigo: 'text-indigo-700 bg-indigo-50 border-indigo-100',
  amber: 'text-amber-700 bg-amber-50 border-amber-100',
};

const LINE = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  indigo: 'bg-indigo-600',
  amber: 'bg-amber-500',
};

export default function MetricCard({
  title,
  value,
  badge,
  color = 'blue',
}) {
  return (
    <div
      className="
        group relative flex flex-col justify-between
        p-5 bg-white border border-slate-200 rounded-xl
        transition-all duration-300 ease-out
        hover:-translate-y-0.5
      "
    >

      {/* TITLE */}
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
        {title}
      </div>

      {/* VALUE (STRICT BLACK SYSTEM) */}
      <div className="mt-3 text-3xl font-black text-slate-900 tracking-tight">
        {value}
      </div>

      {/* BADGE (ONLY COLOR HERE) */}
      {badge && (
        <div className="mt-4">
          <span
            className={`
              text-[10px] px-2 py-0.5 border rounded-md
              uppercase font-bold tracking-wider
              ${BADGE[color] || BADGE.blue}
            `}
          >
            {badge}
          </span>
        </div>
      )}

      {/* 🔥 FIXED LEFT → RIGHT LINE ANIMATION */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
        <div
          className={`
            h-full w-0
            ${LINE[color] || LINE.blue}
            transition-all duration-300 ease-out
            group-hover:w-full
          `}
        />
      </div>
    </div>
  );
}
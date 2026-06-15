import React from 'react';

const VARIANTS = {
  primary: 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white border-slate-900',
  secondary: 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-800 hover:border-slate-300',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg',
  md: 'px-4 py-2 text-sm font-semibold rounded-lg',
  lg: 'px-5 py-2.5 text-sm font-bold rounded-xl',
};

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  type = 'button', 
  onClick, 
  disabled = false,
  className = ''
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 
        border transition-all duration-200 ease-out font-sans
        focus:outline-none focus:ring-1 focus:ring-slate-400 focus:ring-offset-1
        active:scale-[0.99]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `}
    >
      {children}
    </button>
  );
}

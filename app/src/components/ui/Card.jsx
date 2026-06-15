import React from 'react';

export function Card({ children, className = '' }) {
  return (
    <div
      className={`
        bg-white
        border
        border-slate-200/70
        rounded-xl
        transition-colors
        duration-300
        ease-out
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div
      className={`
        px-6
        py-5
        border-b
        border-slate-100/80
        bg-white
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return (
    <div
      className={`
        p-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}
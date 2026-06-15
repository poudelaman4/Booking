import React, { useId } from 'react';

export default function InputField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error = '',
  name,
  disabled = false,
  autoComplete = 'off'
}) {
  const id = useId();
  const hasError = !!error;

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-slate-800">
          {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      
      <input
        id={id}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={`
          w-full px-4 py-2.5 text-sm
          border rounded-lg
          transition-all duration-150
          outline-none
          bg-white text-slate-900 placeholder-slate-400
          focus:ring-2 focus:ring-offset-0
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${hasError
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 hover:border-slate-300'
          }
        `}
      />
      
      {hasError && (
        <span id={`${id}-error`} className="text-xs font-medium text-red-600 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
}
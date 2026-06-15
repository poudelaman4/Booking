import React, { useId } from 'react';

export default function TextArea({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  error = '',
  name,
  rows = 3,
  disabled = false,
  maxLength
}) {
  const id = useId();
  const hasError = !!error;

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-sm font-semibold text-slate-800">
            {label} {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {maxLength && (
            <span className="text-xs text-slate-500">
              {value?.length || 0} / {maxLength}
            </span>
          )}
        </div>
      )}
      
      <textarea
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={`
          w-full px-4 py-2.5 text-sm
          border rounded-lg
          transition-all duration-150
          outline-none
          resize-y
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
import React, { useId } from 'react';

export default function SelectField({
  label,
  value,
  onChange,
  options = [], // Array of objects: { value: 'x', label: 'y' }
  required = false,
  error = '',
  name,
  disabled = false,
  placeholder = 'Choose an option'
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
      
      <div className="relative w-full">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className={`
            w-full px-4 py-2.5 text-sm
            border rounded-lg
            transition-all duration-150
            outline-none
            appearance-none
            bg-right bg-no-repeat
            pr-10
            focus:ring-2 focus:ring-offset-0
            cursor-pointer
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${hasError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
              : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 hover:border-slate-300'
            }
          `}
          style={{
            backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '1.25rem',
            backgroundColor: disabled ? '#f8fafc' : '#ffffff'
          }}
        >
          {!value && <option value="">{placeholder}</option>}
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      
      {hasError && (
        <span id={`${id}-error`} className="text-xs font-medium text-red-600 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
}
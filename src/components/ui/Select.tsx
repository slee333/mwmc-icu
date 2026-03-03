"use client";

import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, className = "", ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-[13px] font-semibold text-text-dim mb-1.5 tracking-wide">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-3.5 py-2.5 bg-input border border-input-border rounded-lg
            text-text text-sm outline-none appearance-none
            transition-colors duration-150 focus:border-accent
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" className="text-text-muted">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;

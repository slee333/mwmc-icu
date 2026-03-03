"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-[13px] font-semibold text-text-dim mb-1.5 tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3.5 py-2.5 bg-input border border-input-border rounded-lg
            text-text text-sm outline-none transition-colors duration-150
            focus:border-accent placeholder:text-text-muted
            ${error ? "border-danger" : ""}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

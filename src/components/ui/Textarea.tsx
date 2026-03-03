"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className = "", ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-[13px] font-semibold text-text-dim mb-1.5 tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full min-h-[280px] p-3.5 bg-input border border-input-border rounded-lg
            text-text text-[13px] font-[family-name:var(--font-mono)] leading-relaxed
            resize-y outline-none transition-colors duration-150
            focus:border-accent placeholder:text-text-muted
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;

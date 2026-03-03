"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "success";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-accent to-blue-600 text-white hover:brightness-110",
  secondary:
    "bg-transparent text-text-dim border border-input-border hover:border-accent hover:text-accent",
  danger:
    "bg-transparent text-danger border border-danger/20 hover:border-danger/50",
  success:
    "bg-gradient-to-br from-success to-emerald-600 text-white hover:brightness-110",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, children, className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          px-6 py-3 rounded-lg text-sm font-semibold tracking-tight
          transition-all duration-150 cursor-pointer
          inline-flex items-center gap-2
          disabled:opacity-40 disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

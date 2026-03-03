"use client";

import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  titleRight?: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ title, subtitle, titleRight, children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-card border border-card-border rounded-xl p-7 mb-5 ${className}`}
        {...props}
      >
        {(title || titleRight) && (
          <div className="flex justify-between items-start mb-1">
            <div>
              {title && (
                <h2 className="text-lg font-bold tracking-tight text-text">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-[13px] text-text-dim mb-5">{subtitle}</p>
              )}
            </div>
            {titleRight}
          </div>
        )}
        {!title && !titleRight && children}
        {(title || titleRight) && children}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;

"use client";

type TagColor = "accent" | "success" | "warning" | "danger" | "muted";

interface TagProps {
  color?: TagColor;
  children: React.ReactNode;
  className?: string;
}

const colorClasses: Record<TagColor, string> = {
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  muted: "bg-text-muted/10 text-text-muted",
};

export default function Tag({ color = "accent", children, className = "" }: TagProps) {
  return (
    <span
      className={`
        inline-block text-[11px] font-bold px-2.5 py-1 rounded-md
        tracking-wider uppercase
        ${colorClasses[color]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

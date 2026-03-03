"use client";

interface StepProgressProps {
  current: number;
  total: number;
}

export default function StepProgress({ current, total }: StepProgressProps) {
  return (
    <div className="flex gap-1 mb-7">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-sm transition-colors duration-300 ${
            i < current
              ? "bg-success"
              : i === current
                ? "bg-accent"
                : "bg-input-border"
          }`}
        />
      ))}
    </div>
  );
}

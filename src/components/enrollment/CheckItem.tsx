"use client";

interface CheckItemProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (id: string) => void;
  type: "inclusion" | "exclusion";
}

export default function CheckItem({
  id,
  label,
  checked,
  onChange,
  type,
}: CheckItemProps) {
  const color = type === "inclusion" ? "success" : "danger";
  const checkedBg =
    type === "inclusion" ? "bg-success/5" : "bg-danger/5";
  const checkedBorder =
    type === "inclusion"
      ? "border-success/20"
      : "border-danger/20";
  const checkedBox =
    type === "inclusion" ? "border-success bg-success" : "border-danger bg-danger";

  return (
    <div
      onClick={() => onChange(id)}
      className={`
        flex items-start gap-3 px-4 py-3 rounded-lg cursor-pointer mb-2
        border transition-all duration-150
        ${checked ? `${checkedBg} ${checkedBorder}` : "border-input-border hover:border-input-border/80"}
      `}
    >
      <div
        className={`
          w-5 h-5 rounded flex-shrink-0 mt-0.5
          border-2 flex items-center justify-center transition-all duration-150
          ${checked ? checkedBox : "border-input-border bg-transparent"}
        `}
      >
        {checked && (
          <span className="text-white text-[13px] font-bold leading-none">
            &#10003;
          </span>
        )}
      </div>
      <span
        className={`text-sm leading-relaxed ${
          checked ? `text-${color}` : "text-text-dim"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import type { JWTPayload } from "@/lib/types";

interface NavTabsProps {
  user: JWTPayload | null;
  subjectCount?: number;
}

export default function NavTabs({ user, subjectCount = 0 }: NavTabsProps) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { key: "enroll", label: "New Enrollment", href: "/enroll" },
    { key: "log", label: `Log (${subjectCount})`, href: "/log" },
    ...(user?.role === "admin"
      ? [{ key: "export", label: "Export", href: "/export" }]
      : []),
  ];

  return (
    <div className="flex gap-2 px-6 py-3 border-b border-card-border">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <button
            key={tab.key}
            onClick={() => router.push(tab.href)}
            className={`
              px-5 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer
              transition-all duration-150 border
              ${
                active
                  ? "border-accent text-accent"
                  : "border-input-border text-text-dim hover:border-accent/50 hover:text-text"
              }
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

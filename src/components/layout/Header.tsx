"use client";

import { useRouter } from "next/navigation";
import type { JWTPayload } from "@/lib/types";

interface HeaderProps {
  user: JWTPayload | null;
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="bg-gradient-to-r from-card-border to-[#0F172A] border-b border-card-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-base font-bold tracking-tight">
        <span className="text-xl">&#x2695;</span>
        <span>ICU LLM Study Platform</span>
        <span className="text-[10px] font-semibold bg-accent-dim text-accent px-2 py-0.5 rounded tracking-wider uppercase">
          Research Use Only
        </span>
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-xs text-text-muted">
            {user.displayName} ({user.role})
          </span>
          <button
            onClick={handleLogout}
            className="text-xs text-text-muted hover:text-text transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}

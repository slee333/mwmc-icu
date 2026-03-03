"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-card border border-card-border rounded-xl p-7 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-text">{title}</h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors text-xl leading-none cursor-pointer"
          >
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

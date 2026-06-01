import type { ReactNode } from "react";
import { Button } from "./UI";

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-vora-ink/35 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
      <div className="max-h-[92vh] w-full max-w-[500px] overflow-y-auto rounded-t-[30px] border border-vora-line bg-vora-paper p-5 shadow-card sm:rounded-[30px]">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-vora-line/80 pb-3">
          <h2 className="text-xl font-black tracking-[-0.04em] text-vora-ink">{title}</h2>
          <Button variant="ghost" onClick={onClose} className="min-h-9 px-3">
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

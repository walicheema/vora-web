"use client";

import { useState } from "react";
import { BUDGET_SIGNAL_KEYS, BUDGET_SIGNALS, MORE_SIGNAL_GROUPS, QUICK_SIGNALS, signalKey, type SignalOption } from "@/lib/signals";
import { Button, Chip } from "./UI";
import { Modal } from "./Modal";

export function TableFilters({
  selectedKeys,
  pending,
  loading,
  onToggle,
  onBudget,
  onUpdate
}: {
  selectedKeys: string[];
  pending: boolean;
  loading: boolean;
  onToggle: (option: SignalOption) => void;
  onBudget: (option: SignalOption) => void;
  onUpdate: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {QUICK_SIGNALS.map((option) => (
          <Chip key={signalKey(option)} selected={selectedKeys.includes(signalKey(option))} onClick={() => onToggle(option)}>
            {option.label}
          </Chip>
        ))}
        <Chip selected={selectedKeys.some((key) => !BUDGET_SIGNAL_KEYS.has(key) && !QUICK_SIGNALS.some((option) => signalKey(option) === key))} onClick={() => setMoreOpen(true)}>
          More
        </Chip>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {BUDGET_SIGNALS.map((option) => (
            <Chip key={signalKey(option)} selected={selectedKeys.includes(signalKey(option))} onClick={() => onBudget(option)}>
              {option.label}
            </Chip>
          ))}
        </div>
        {pending ? (
          <Button variant="secondary" loading={loading} onClick={onUpdate} className="shrink-0">
            Update
          </Button>
        ) : null}
      </div>

      <p className="min-h-5 text-sm font-semibold text-vora-subtle">
        {loading ? "Updating the table..." : pending ? "Updates pending. Vora will recalculate in a moment." : "Filters recalculate the shortlist."}
      </p>

      <Modal open={moreOpen} title="More filters" onClose={() => setMoreOpen(false)}>
        <div className="space-y-5">
          {MORE_SIGNAL_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-vora-subtle">{group.title}</p>
              <div className="flex flex-wrap gap-2">
                {group.options.map((option) => (
                  <Chip key={signalKey(option)} selected={selectedKeys.includes(signalKey(option))} onClick={() => onToggle(option)}>
                    {option.label}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
          <Button className="w-full" onClick={() => setMoreOpen(false)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}

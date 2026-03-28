"use client";

import type { ArrowValue } from "@/lib/types";

type Props = {
  value: ArrowValue;
  label: string;
  onPick: (v: ArrowValue) => void;
  disabled?: boolean;
};

export function ArrowScoreButton({
  value,
  label,
  onPick,
  disabled,
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPick(value)}
      className="min-h-[52px] min-w-[52px] rounded-lg border border-border bg-[#141414] px-2 py-2 font-mono text-base font-semibold text-primary shadow-inner transition hover:border-accent hover:text-accent active:scale-95 disabled:opacity-40 sm:min-h-[56px] sm:min-w-[56px] sm:text-lg"
    >
      {label}
    </button>
  );
}

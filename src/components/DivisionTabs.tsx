"use client";

type Props = {
  divisions: string[];
  active: string;
  onChange: (d: string) => void;
};

export function DivisionTabs({ divisions, active, onChange }: Props) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-2 print:overflow-visible">
      {divisions.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={`shrink-0 rounded-full border px-4 py-2 font-heading text-sm uppercase tracking-wide transition ${
            d === active
              ? "border-accent bg-accent/20 text-accent"
              : "border-border bg-surface text-secondary hover:border-accent/50"
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  );
}

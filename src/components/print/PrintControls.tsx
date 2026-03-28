"use client";

export function PrintControls() {
  return (
    <div className="mb-6 flex gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg bg-accent px-4 py-2 font-heading font-bold text-black"
      >
        Print
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";

const linkCls =
  "text-secondary hover:text-accent transition-colors text-sm font-heading uppercase tracking-wide";

/** Client-only shell: not hydrated from SSR, so extension-injected DOM attrs cannot mismatch React. */
export default function SiteNavClient() {
  return (
    <nav className="print:hidden border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="font-heading text-lg font-semibold tracking-tight text-primary"
        >
          Archery TMS
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/admin" className={linkCls}>
            Admin
          </Link>
          <Link href="/judge" className={linkCls}>
            Judge
          </Link>
          <Link href="/display" className={linkCls}>
            Display
          </Link>
        </div>
      </div>
    </nav>
  );
}

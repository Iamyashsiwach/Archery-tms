"use client";

import dynamic from "next/dynamic";

const SiteNavClient = dynamic(() => import("@/components/SiteNavClient"), {
  ssr: false,
  loading: () => (
    <div
      className="print:hidden h-[52px] shrink-0 border-b border-border bg-surface/80"
      aria-hidden
    />
  ),
});

/** Loads nav only on the client to avoid hydration vs extension-injected DOM attributes. */
export function SiteNavLoader() {
  return <SiteNavClient />;
}

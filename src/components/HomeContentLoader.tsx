"use client";

import dynamic from "next/dynamic";

const HomeContent = dynamic(
  () =>
    import("@/components/HomeContent").then((m) => ({ default: m.HomeContent })),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto min-h-[40vh] max-w-2xl px-4 py-16" aria-hidden />
    ),
  }
);

export function HomeContentLoader() {
  return <HomeContent />;
}

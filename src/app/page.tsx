import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary sm:text-5xl">
        Archery Tournament Management
      </h1>
      <p className="mt-4 text-secondary">
        Coaches register their archers (private links from admin). Judges score
        qualification and matches; everyone sees live rankings, brackets, and
        field target boards.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/admin"
          className="rounded-xl border border-border bg-surface px-8 py-4 font-heading text-sm font-semibold uppercase tracking-wider text-accent transition hover:border-accent"
        >
          Admin
        </Link>
        <Link
          href="/judge"
          className="rounded-xl bg-accent px-8 py-4 font-heading text-sm font-semibold uppercase tracking-wider text-black transition hover:opacity-90"
        >
          Judge
        </Link>
        <Link
          href="/display"
          className="rounded-xl border border-border bg-surface px-8 py-4 font-heading text-sm font-semibold uppercase tracking-wider text-primary transition hover:border-accent"
        >
          Public display
        </Link>
      </div>
    </div>
  );
}

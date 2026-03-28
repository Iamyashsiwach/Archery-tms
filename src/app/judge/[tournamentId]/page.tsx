import Link from "next/link";

export default async function JudgeHomePage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-heading text-2xl font-bold">Judge tools</h1>
      <div className="mt-6 flex flex-col gap-3">
        <Link
          className="rounded-xl border border-border bg-surface px-4 py-4 text-center font-heading uppercase tracking-wide text-accent hover:border-accent"
          href={`/judge/${tournamentId}/register`}
        >
          Register archer
        </Link>
        <Link
          className="rounded-xl bg-accent px-4 py-4 text-center font-heading font-semibold uppercase tracking-wide text-black"
          href={`/judge/${tournamentId}/score`}
        >
          Enter scores
        </Link>
        <Link
          className="rounded-xl border border-border bg-surface px-4 py-4 text-center font-heading uppercase tracking-wide text-primary hover:border-accent"
          href={`/judge/${tournamentId}/match`}
        >
          Match scoring
        </Link>
        <Link
          className="rounded-xl border-2 border-accent/60 bg-surface px-4 py-4 text-center font-heading text-lg font-semibold uppercase tracking-wide text-accent hover:bg-accent/10"
          href={`/judge/${tournamentId}/targets`}
        >
          Target allotment
        </Link>
      </div>
    </div>
  );
}

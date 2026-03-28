import Link from "next/link";

export default async function JudgeRegisterRedirectPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="font-heading text-2xl font-bold text-primary">
        Coach registration
      </h1>
      <p className="mt-4 text-secondary">
        Athletes are registered by <strong>coaches</strong> using a private invite
        link created in <strong>Admin → Coach invites</strong>. Coaches cannot see
        other clubs’ entries. After they lock, only judges (or admin) can change
        details — use <strong>Judge → Roster</strong>.
      </p>
      <Link
        href={`/judge/${tournamentId}`}
        className="mt-8 inline-block rounded-xl border border-accent px-6 py-3 font-heading text-accent hover:bg-accent/10"
      >
        ← Back to judge tools
      </Link>
    </div>
  );
}

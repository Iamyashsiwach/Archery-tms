import { TargetsPageView } from "@/components/targets/TargetsPageView";

export default async function DisplayTargetsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return (
    <TargetsPageView
      tournamentId={tournamentId}
      backHref={`/display/${tournamentId}`}
      backLabel="Leaderboard"
      emphasize
    />
  );
}

import { LeaderboardView } from "@/components/display/LeaderboardView";

export default async function DisplayLeaderboardPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return <LeaderboardView tournamentId={tournamentId} />;
}

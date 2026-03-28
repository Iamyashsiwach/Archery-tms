import { MatchScoreView } from "@/components/judge/MatchScoreView";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return <MatchScoreView tournamentId={tournamentId} />;
}

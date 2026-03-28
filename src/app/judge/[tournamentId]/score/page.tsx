import { ScoreEntryView } from "@/components/judge/ScoreEntryView";

export default async function JudgeScorePage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return <ScoreEntryView tournamentId={tournamentId} />;
}

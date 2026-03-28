import { JudgeRosterView } from "@/components/judge/JudgeRosterView";

export default async function JudgeRosterPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return <JudgeRosterView tournamentId={tournamentId} />;
}

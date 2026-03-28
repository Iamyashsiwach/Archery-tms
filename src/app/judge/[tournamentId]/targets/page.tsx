import { TargetsPageView } from "@/components/targets/TargetsPageView";

export default async function JudgeTargetsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return (
    <TargetsPageView
      tournamentId={tournamentId}
      backHref={`/judge/${tournamentId}`}
      backLabel="Judge tools"
      emphasize
    />
  );
}

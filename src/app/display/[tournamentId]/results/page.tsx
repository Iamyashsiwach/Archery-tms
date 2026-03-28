import { ResultsView } from "@/components/display/ResultsView";

export default async function DisplayResultsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return <ResultsView tournamentId={tournamentId} />;
}

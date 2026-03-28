import { ResultsPrintView } from "@/components/print/ResultsPrintView";

export default async function PrintResultsPage({
  params,
}: {
  params: Promise<{ tournamentId: string; division: string }>;
}) {
  const { tournamentId, division } = await params;
  const decoded = decodeURIComponent(division);
  return <ResultsPrintView tournamentId={tournamentId} division={decoded} />;
}

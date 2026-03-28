import { ScoresheetPrintView } from "@/components/print/ScoresheetPrintView";

export default async function PrintScoresheetPage({
  params,
}: {
  params: Promise<{ tournamentId: string; archerId: string }>;
}) {
  const { tournamentId, archerId } = await params;
  return <ScoresheetPrintView tournamentId={tournamentId} archerId={archerId} />;
}

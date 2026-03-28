import { BracketPrintView } from "@/components/print/BracketPrintView";

export default async function PrintBracketPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return <BracketPrintView tournamentId={tournamentId} />;
}

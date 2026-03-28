import { BracketDisplayView } from "@/components/display/BracketDisplayView";

export default async function BracketPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return <BracketDisplayView tournamentId={tournamentId} />;
}

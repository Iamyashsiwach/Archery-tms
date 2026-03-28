import { CoachPortal } from "@/components/coach/CoachPortal";

export default async function CoachPage({
  params,
}: {
  params: Promise<{ tournamentId: string; token: string }>;
}) {
  const { tournamentId, token } = await params;
  return <CoachPortal tournamentId={tournamentId} token={token} />;
}

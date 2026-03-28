import { JudgeAccessLayout } from "@/components/judge/JudgeAccessLayout";

export default async function JudgeTournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return (
    <JudgeAccessLayout tournamentId={tournamentId}>
      {children}
    </JudgeAccessLayout>
  );
}

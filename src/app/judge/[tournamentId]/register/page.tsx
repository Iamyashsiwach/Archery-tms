import { RegisterArcherView } from "@/components/judge/RegisterArcherView";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return <RegisterArcherView tournamentId={tournamentId} />;
}

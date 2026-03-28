"use client";

import Link from "next/link";
import { useState } from "react";
import { useArchers } from "@/hooks/useArchers";
import { useTournament } from "@/hooks/useTournament";
import { useSupabase } from "@/components/SupabaseProvider";
import { BOW_LABEL, BOW_TYPES } from "@/lib/categoryGrouper";
import type { AgeCategory, BowType, Gender } from "@/lib/types";

const ages: AgeCategory[] = ["U18", "U21", "SENIOR", "MASTER", "VETERAN"];
const genders: Gender[] = ["M", "F", "X"];

export function RegisterArcherView({ tournamentId }: { tournamentId: string }) {
  const supabase = useSupabase();
  const { tournament } = useTournament(supabase, tournamentId);
  const { registerArcher } = useArchers(supabase, tournamentId);
  const [name, setName] = useState("");
  const [club, setClub] = useState("");
  const [age, setAge] = useState<AgeCategory>("SENIOR");
  const [gender, setGender] = useState<Gender>("M");
  const [bow, setBow] = useState<BowType>("RECURVE");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMsg("Name required");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await registerArcher({
        tournament_id: tournamentId,
        name: name.trim(),
        club: club.trim() || null,
        age_category: age,
        gender,
        bow_type: bow,
      });
      setName("");
      setClub("");
      setMsg("Archer registered.");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link href={`/judge/${tournamentId}`} className="text-sm text-accent">
        ← Back
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-bold">Register archer</h1>
      {tournament && (
        <p className="mt-1 text-secondary">{tournament.name}</p>
      )}
      <form onSubmit={(e) => void submit(e)} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-secondary">Name</span>
          <input
            required
            className="rounded-lg border border-border bg-surface px-3 py-2 text-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-secondary">School / region</span>
          <input
            className="rounded-lg border border-border bg-surface px-3 py-2 text-primary"
            value={club}
            onChange={(e) => setClub(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-secondary">Age category</span>
          <select
            className="rounded-lg border border-border bg-surface px-3 py-2"
            value={age}
            onChange={(e) => setAge(e.target.value as AgeCategory)}
          >
            {ages.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-secondary">Gender</span>
          <select
            className="rounded-lg border border-border bg-surface px-3 py-2"
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
          >
            {genders.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-secondary">Bow type</span>
          <select
            className="rounded-lg border border-border bg-surface px-3 py-2"
            value={bow}
            onChange={(e) => setBow(e.target.value as BowType)}
          >
            {BOW_TYPES.map((b) => (
              <option key={b} value={b}>
                {BOW_LABEL[b]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-accent py-3 font-heading font-bold uppercase text-black disabled:opacity-50"
        >
          Save
        </button>
      </form>
      {msg && <p className="mt-4 text-sm text-secondary">{msg}</p>}
    </div>
  );
}

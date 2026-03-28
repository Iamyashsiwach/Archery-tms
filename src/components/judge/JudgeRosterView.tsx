"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useArchers } from "@/hooks/useArchers";
import { useTournament } from "@/hooks/useTournament";
import { useSupabase } from "@/components/SupabaseProvider";
import {
  BOW_LABEL,
  BOW_TYPES,
  coerceBowType,
  getDivision,
} from "@/lib/categoryGrouper";
import type { AgeCategory, Archer, BowType, Gender } from "@/lib/types";

const ages: AgeCategory[] = ["U18", "U21", "SENIOR", "MASTER", "VETERAN"];
const genders: Gender[] = ["M", "F", "X"];

export function JudgeRosterView({ tournamentId }: { tournamentId: string }) {
  const supabase = useSupabase();
  const { tournament } = useTournament(supabase, tournamentId);
  const { archers, loading, refetch } = useArchers(supabase, tournamentId, {
    includeDeleted: true,
  });
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [msg, setMsg] = useState<string | null>(null);

  const active = useMemo(
    () => archers.filter((a) => !a.deleted_at),
    [archers]
  );
  const trash = useMemo(
    () => archers.filter((a) => a.deleted_at),
    [archers]
  );

  const list = tab === "active" ? active : trash;

  const moveToTrash = async (a: Archer) => {
    if (!supabase) return;
    if (!confirm(`Move ${a.name} to trash?`)) return;
    const { error } = await supabase
      .from("archers")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", a.id);
    if (error) setMsg(error.message);
    else {
      setMsg("Moved to trash.");
      await refetch();
    }
  };

  const restore = async (a: Archer) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("archers")
      .update({ deleted_at: null })
      .eq("id", a.id);
    if (error) setMsg(error.message);
    else {
      setMsg("Restored.");
      await refetch();
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href={`/judge/${tournamentId}`} className="text-sm text-accent">
        ← Back
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-bold">Judge roster</h1>
      {tournament && (
        <p className="text-sm text-secondary">{tournament.name}</p>
      )}
      <p className="mt-2 text-sm text-secondary">
        Coaches register athletes via their private invite. You can edit any row
        or restore trash — even after a coach locks their list.
      </p>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          className={`rounded-lg px-4 py-2 font-heading text-sm ${tab === "active" ? "bg-accent text-black" : "border border-border"}`}
          onClick={() => setTab("active")}
        >
          Active ({active.length})
        </button>
        <button
          type="button"
          className={`rounded-lg px-4 py-2 font-heading text-sm ${tab === "trash" ? "bg-accent text-black" : "border border-border"}`}
          onClick={() => setTab("trash")}
        >
          Trash ({trash.length})
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-secondary">Loading…</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-secondary">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Division</th>
                <th className="p-2">Bale</th>
                <th className="p-2">Lock</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <RosterRow
                  key={a.id}
                  archer={a}
                  tournamentId={tournamentId}
                  tab={tab}
                  onSaved={() => void refetch()}
                  onTrash={() => void moveToTrash(a)}
                  onRestore={() => void restore(a)}
                  setMsg={setMsg}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {msg && <p className="mt-4 text-sm text-secondary">{msg}</p>}
    </div>
  );
}

function RosterRow({
  archer: a,
  tournamentId,
  tab,
  onSaved,
  onTrash,
  onRestore,
  setMsg,
}: {
  archer: Archer;
  tournamentId: string;
  tab: "active" | "trash";
  onSaved: () => void;
  onTrash: () => void;
  onRestore: () => void;
  setMsg: (s: string | null) => void;
}) {
  const supabase = useSupabase();
  const [name, setName] = useState(a.name);
  const [age, setAge] = useState<AgeCategory>(a.age_category ?? "SENIOR");
  const [gender, setGender] = useState<Gender>(a.gender ?? "M");
  const [bow, setBow] = useState<BowType>(coerceBowType(a.bow_type));
  const [club, setClub] = useState(a.club ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(a.name);
    setAge(a.age_category ?? "SENIOR");
    setGender(a.gender ?? "M");
    setBow(coerceBowType(a.bow_type));
    setClub(a.club ?? "");
  }, [a]);

  const save = async () => {
    if (!supabase) return;
    setSaving(true);
    setMsg(null);
    const division = getDivision(bow, gender, age);
    const { error } = await supabase
      .from("archers")
      .update({
        name: name.trim(),
        club: club.trim() || null,
        age_category: age,
        gender,
        bow_type: bow,
        division,
      })
      .eq("id", a.id)
      .eq("tournament_id", tournamentId);
    setSaving(false);
    if (error) setMsg(error.message);
    else {
      setMsg("Saved.");
      onSaved();
    }
  };

  if (tab === "trash") {
    return (
      <tr className="border-t border-border/50 opacity-80">
        <td className="p-2">{a.name}</td>
        <td className="p-2">{a.division}</td>
        <td className="p-2 font-mono">
          {a.bale_number ?? "—"} / {a.slot_index ?? "—"}
        </td>
        <td className="p-2">—</td>
        <td className="p-2">
          <button
            type="button"
            className="text-accent text-xs"
            onClick={() => void onRestore()}
          >
            Restore
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border/50">
      <td className="p-2 align-top">
        <input
          className="w-full min-w-[120px] rounded border border-border bg-background px-2 py-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </td>
      <td className="p-2 align-top text-xs text-secondary">
        {getDivision(bow, gender, age)}
      </td>
      <td className="p-2 align-top font-mono text-xs">
        {a.bale_number ?? "—"} / {a.slot_index ?? "—"}
      </td>
      <td className="p-2 align-top text-xs">
        {a.registration_locked ? "Coach locked" : "—"}
      </td>
      <td className="p-2 align-top">
        <div className="flex flex-col gap-1">
          <select
            className="rounded border border-border bg-background px-1 py-1 text-xs"
            value={age}
            onChange={(e) => setAge(e.target.value as AgeCategory)}
          >
            {ages.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-border bg-background px-1 py-1 text-xs"
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
          >
            {genders.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-border bg-background px-1 py-1 text-xs"
            value={bow}
            onChange={(e) => setBow(e.target.value as BowType)}
          >
            {BOW_TYPES.map((x) => (
              <option key={x} value={x}>
                {BOW_LABEL[x]}
              </option>
            ))}
          </select>
          <input
            placeholder="School / region"
            className="rounded border border-border bg-background px-1 py-1 text-xs"
            value={club}
            onChange={(e) => setClub(e.target.value)}
          />
          <button
            type="button"
            disabled={saving}
            className="rounded bg-accent py-1 text-xs font-bold text-black"
            onClick={() => void save()}
          >
            Save
          </button>
          <button
            type="button"
            className="text-xs text-danger"
            onClick={() => void onTrash()}
          >
            Trash
          </button>
        </div>
      </td>
    </tr>
  );
}

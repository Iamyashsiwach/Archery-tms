"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowScoreButton } from "@/components/ArrowScoreButton";
import { useTeamScores } from "@/hooks/useTeamScores";
import { useTeams } from "@/hooks/useTeams";
import { useTournament } from "@/hooks/useTournament";
import {
  bumpRegistrationToQualificationIfNeeded,
  recalculateTeamResult,
} from "@/lib/resultsSync";
import { calculateTotal, getEventConfig, validateEnd } from "@/lib/rulesEngine";
import { useSupabase } from "@/components/SupabaseProvider";
import type { ArrowValue, Team } from "@/lib/types";

function labelFor(v: ArrowValue): string {
  if (v === "M") return "M";
  if (v === "X") return "X";
  return String(v);
}

export function TeamScoreEntryView({ tournamentId }: { tournamentId: string }) {
  const supabase = useSupabase();
  const { tournament, refetch: refetchT } = useTournament(supabase, tournamentId);
  const { teams, refetch: refetchTeams } = useTeams(supabase, tournamentId);
  const [teamId, setTeamId] = useState<string>("");
  const { scores, refetch: refetchScores } = useTeamScores(
    supabase,
    tournamentId,
    teamId || undefined
  );

  const qualScores = useMemo(
    () => scores.filter((s) => s.round === "QUALIFICATION"),
    [scores]
  );

  const config = useMemo(() => {
    if (!tournament) return null;
    return getEventConfig(tournament.event_type, tournament);
  }, [tournament]);

  const nextEnd = qualScores.length + 1;
  const running = calculateTotal(qualScores);

  const [slots, setSlots] = useState<(ArrowValue | null)[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!config) {
      setSlots([]);
      return;
    }
    setSlots(Array.from({ length: config.arrowsPerEnd }, () => null));
  }, [config, teamId]);

  const activeIndex = slots.findIndex((s) => s === null);
  const preview = useMemo(() => {
    if (!config) return { total: 0, xCount: 0, valid: false };
    const filled = slots.filter((s): s is ArrowValue => s !== null);
    if (filled.length !== config.arrowsPerEnd) {
      return { total: 0, xCount: 0, valid: false };
    }
    const v = validateEnd(filled, config);
    return { total: v.total, xCount: v.xCount, valid: v.valid };
  }, [slots, config]);

  const pick = useCallback((v: ArrowValue) => {
    setSlots((prev) => {
      const i = prev.findIndex((s) => s === null);
      if (i === -1) return prev;
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }, []);

  const clearSlot = (idx: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  };

  const selectedTeam = teams.find((t) => t.id === teamId) ?? null;

  const submit = async () => {
    if (!supabase || !tournament || !config || !selectedTeam) return;
    const filled = slots.filter((s): s is ArrowValue => s !== null);
    const v = validateEnd(filled, config);
    if (!v.valid || filled.length !== config.arrowsPerEnd) {
      setMsg(v.errors.join(" ") || "Complete all arrows.");
      return;
    }
    if (nextEnd > config.endCount) {
      setMsg("All qualification ends recorded for this team.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await bumpRegistrationToQualificationIfNeeded(supabase, tournament.id);
      const { error: insErr } = await supabase.from("team_scores").insert({
        team_id: selectedTeam.id,
        tournament_id: tournament.id,
        round: "QUALIFICATION",
        end_number: nextEnd,
        arrows: filled,
        end_total: v.total,
        x_count: v.xCount,
      });
      if (insErr) throw insErr;

      await recalculateTeamResult(
        supabase,
        selectedTeam.id,
        tournament.id,
        selectedTeam.division
      );

      setSlots(Array.from({ length: config.arrowsPerEnd }, () => null));
      await refetchScores();
      await refetchT();
      await refetchTeams();
      setMsg("End saved.");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (!supabase) {
    return (
      <p className="text-danger">
        Configure Supabase environment variables to use scoring.
      </p>
    );
  }

  if (!tournament || !config) {
    return <p className="text-secondary">Loading tournament…</p>;
  }

  const canSubmit =
    preview.valid && teamId && nextEnd <= config.endCount && !busy;

  const zones = config.scoringZones;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/judge/${tournamentId}`}
          className="text-sm text-accent hover:underline"
        >
          ← Back
        </Link>
        <span className="font-heading text-xs uppercase text-secondary">
          {tournament.name}
        </span>
      </div>

      <p className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-secondary">
        <strong className="text-primary">Team event:</strong> one end per team (all
        archers on that bale). {config.arrowsPerEnd} arrows per end,{" "}
        {config.endCount} ends — cumulative team total.
      </p>

      <label className="flex flex-col gap-1">
        <span className="font-heading text-sm uppercase text-secondary">
          Team
        </span>
        <select
          className="rounded-lg border border-border bg-surface px-3 py-3 font-heading text-primary"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
        >
          <option value="">Select team…</option>
          {teams.map((t: Team) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {selectedTeam && (
          <span className="text-sm text-secondary">
            {selectedTeam.division ?? "No division"}
          </span>
        )}
      </label>

      {teams.length === 0 && (
        <p className="text-sm text-secondary">
          No teams in this tournament. Add teams in Admin first.
        </p>
      )}

      {teamId && (
        <>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="font-heading text-lg text-primary">
              End {Math.min(nextEnd, config.endCount)} of {config.endCount}
            </p>
            <p className="mt-1 font-mono text-sm text-secondary">
              Running total:{" "}
              <span className="text-accent">{running.total}</span> · X:{" "}
              {running.xCount}
            </p>
          </div>

          <div>
            <p className="mb-2 font-heading text-xs uppercase text-secondary">
              Arrows
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              {slots.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => s !== null && clearSlot(idx)}
                  className={`flex h-14 min-w-[52px] items-center justify-center rounded-lg border-2 px-3 font-mono text-lg ${
                    idx === activeIndex
                      ? "border-accent bg-accent/10 text-primary"
                      : "border-border bg-[#1a1a1a] text-primary"
                  }`}
                >
                  {s === null ? "·" : labelFor(s)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {zones.map((z) => (
                <ArrowScoreButton
                  key={String(z)}
                  value={z}
                  label={labelFor(z)}
                  onPick={pick}
                  disabled={activeIndex === -1 || busy}
                />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border/80 bg-[#1a1a1a] px-4 py-3 font-mono text-sm">
            End preview:{" "}
            <span className="text-accent">{preview.total}</span> · X:{" "}
            {preview.xCount}
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void submit()}
            className="rounded-xl bg-accent py-4 font-heading text-lg font-bold uppercase tracking-wide text-black disabled:opacity-40"
          >
            Submit end
          </button>
        </>
      )}

      {msg && (
        <p
          className={`text-center text-sm ${msg.includes("failed") || msg.includes("Complete") ? "text-danger" : "text-secondary"}`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}

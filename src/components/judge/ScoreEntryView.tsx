"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowScoreButton } from "@/components/ArrowScoreButton";
import { useArchers } from "@/hooks/useArchers";
import { useScores } from "@/hooks/useScores";
import { useTournament } from "@/hooks/useTournament";
import { getDivision } from "@/lib/categoryGrouper";
import {
  bumpRegistrationToQualificationIfNeeded,
  maybeGenerateBracketForDivision,
  recalculateArcherResult,
} from "@/lib/resultsSync";
import { baleLabel, slotLabel } from "@/lib/archeryTerms";
import { calculateTotal, getEventConfig, validateEnd } from "@/lib/rulesEngine";
import { slotLetter } from "@/lib/targetAllotment";
import { useSupabase } from "@/components/SupabaseProvider";
import type { Archer, ArrowValue } from "@/lib/types";

function labelFor(v: ArrowValue): string {
  if (v === "M") return "M";
  if (v === "X") return "X";
  return String(v);
}

export function ScoreEntryView({ tournamentId }: { tournamentId: string }) {
  const supabase = useSupabase();
  const { tournament, refetch: refetchT } = useTournament(supabase, tournamentId);
  const { archers, refetch: refetchArchers } = useArchers(
    supabase,
    tournamentId
  );
  const [archerId, setArcherId] = useState<string>("");
  const { scores, refetch: refetchScores } = useScores(
    supabase,
    tournamentId,
    archerId || undefined
  );

  const qualScores = useMemo(
    () => scores.filter((s) => s.round === "QUALIFICATION"),
    [scores]
  );

  const config = useMemo(() => {
    if (!tournament) return null;
    return tournament.event_type === "CUSTOM"
      ? getEventConfig("CUSTOM", tournament)
      : getEventConfig(tournament.event_type);
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
  }, [config, archerId]);

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

  const pick = useCallback(
    (v: ArrowValue) => {
      setSlots((prev) => {
        const i = prev.findIndex((s) => s === null);
        if (i === -1) return prev;
        const next = [...prev];
        next[i] = v;
        return next;
      });
    },
    [setSlots]
  );

  const clearSlot = (idx: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  };

  const selectedArcher = archers.find((a) => a.id === archerId) ?? null;

  const submit = async () => {
    if (!supabase || !tournament || !config || !selectedArcher) return;
    const filled = slots.filter((s): s is ArrowValue => s !== null);
    const v = validateEnd(filled, config);
    if (!v.valid || filled.length !== config.arrowsPerEnd) {
      setMsg(v.errors.join(" ") || "Complete all arrows.");
      return;
    }
    if (nextEnd > config.endCount) {
      setMsg("All qualification ends recorded for this archer.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await bumpRegistrationToQualificationIfNeeded(supabase, tournament.id);
      const { error: insErr } = await supabase.from("scores").insert({
        archer_id: selectedArcher.id,
        tournament_id: tournament.id,
        round: "QUALIFICATION",
        end_number: nextEnd,
        arrows: filled,
        end_total: v.total,
        x_count: v.xCount,
      });
      if (insErr) throw insErr;

      await recalculateArcherResult(
        supabase,
        selectedArcher.id,
        tournament.id,
        selectedArcher.division
      );

      const divName =
        selectedArcher.division ??
        getDivision(
          selectedArcher.bow_type,
          selectedArcher.gender,
          selectedArcher.age_category
        );

      await refetchArchers();
      const fresh = await fetchArchersRaw(supabase, tournament.id);
      await maybeGenerateBracketForDivision(
        supabase,
        tournament.id,
        divName,
        config.endCount,
        fresh
      );

      setSlots(
        Array.from({ length: config.arrowsPerEnd }, () => null)
      );
      await refetchScores();
      await refetchT();
      setMsg("End saved.");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  async function fetchArchersRaw(
    client: NonNullable<typeof supabase>,
    tid: string
  ) {
    const { data } = await client
      .from("archers")
      .select("*")
      .eq("tournament_id", tid);
    return (data as Archer[]) ?? [];
  }

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
    preview.valid &&
    archerId &&
    nextEnd <= config.endCount &&
    !busy;

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

      <label className="flex flex-col gap-1">
        <span className="font-heading text-sm uppercase text-secondary">
          Archer
        </span>
        <select
          className="rounded-lg border border-border bg-surface px-3 py-3 font-heading text-primary"
          value={archerId}
          onChange={(e) => setArcherId(e.target.value)}
        >
          <option value="">Select archer…</option>
          {archers.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {selectedArcher && (
          <span className="text-sm text-secondary">
            {selectedArcher.division}
          </span>
        )}
      </label>

      {archerId && (
        <>
          <Link
            href={`/print/${tournamentId}/scoresheet/${archerId}`}
            className="text-center text-sm text-accent hover:underline"
          >
            Printable scoresheet
          </Link>
          {selectedArcher &&
            selectedArcher.bale_number != null &&
            selectedArcher.slot_index != null && (
              <div className="rounded-xl border-2 border-accent/40 bg-[#141414] p-4">
                <p className="font-heading text-xs uppercase tracking-wide text-accent">
                  Field assignment
                </p>
                <p className="mt-1 font-mono text-xl text-primary sm:text-2xl">
                  {baleLabel()} {selectedArcher.bale_number}{" "}
                  · {slotLabel()}{" "}
                  {slotLetter(selectedArcher.slot_index)}
                </p>
              </div>
            )}
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

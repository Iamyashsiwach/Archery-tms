"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { adminForceBracketGeneration } from "@/lib/adminBracket";
import { downloadCsv, rowsToCsv } from "@/lib/csv";
import { EVENT_FORMAT_HINT, EVENT_FORMAT_LABELS } from "@/lib/eventLabels";
import { getEventConfig } from "@/lib/rulesEngine";
import { assignArchersToBales, slotLetter } from "@/lib/targetAllotment";
import type {
  Archer,
  Coach,
  EventType,
  ScoreRow,
  Tournament,
} from "@/lib/types";

const ADMIN_KEY = "archery_admin_ok";

const EVENT_TYPES: EventType[] = [
  "WA18",
  "WA25",
  "WA720",
  "R360",
  "NFAA_FIELD",
  "CUSTOM",
];

export function AdminDashboard() {
  const supabase = useSupabase();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [archers, setArchers] = useState<Archer[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);

  const [name, setName] = useState("");
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [eventType, setEventType] = useState<EventType>("WA18");
  const [customArrows, setCustomArrows] = useState(3);
  const [customEnds, setCustomEnds] = useState(20);
  const [customMax, setCustomMax] = useState(10);
  const [msg, setMsg] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [judgeCode, setJudgeCode] = useState("");
  const [perBale, setPerBale] = useState(4);
  const [balesInput, setBalesInput] = useState(4);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [newCoachName, setNewCoachName] = useState("");
  const [newCoachClub, setNewCoachClub] = useState("");
  const [origin, setOrigin] = useState("");

  const tDetail = useMemo((): Tournament | null => {
    if (selected == null) return null;
    return tournaments.find((x) => x.id === selected) ?? null;
  }, [tournaments, selected]);

  const expectedPin = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "admin1234";

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUnlocked(localStorage.getItem(ADMIN_KEY) === "1");
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!supabase || !unlocked) return;
    void supabase
      .from("tournaments")
      .select("*")
      .order("date", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setDbError(error.message);
          setTournaments([]);
          return;
        }
        setDbError(null);
        setTournaments((data as Tournament[]) ?? []);
      });
  }, [supabase, unlocked]);

  const loadTournamentDetail = useCallback(async () => {
    if (!supabase || !selected) return;
    const [{ data: a }, { data: s }] = await Promise.all([
      supabase
        .from("archers")
        .select("*")
        .eq("tournament_id", selected)
        .is("deleted_at", null),
      supabase.from("scores").select("*").eq("tournament_id", selected),
    ]);
    setArchers((a as Archer[]) ?? []);
    setScores((s as ScoreRow[]) ?? []);
  }, [supabase, selected]);

  const loadCoaches = useCallback(async () => {
    if (!supabase || !selected) return;
    const { data } = await supabase
      .from("coaches")
      .select("*")
      .eq("tournament_id", selected)
      .order("created_at", { ascending: true });
    setCoaches((data as Coach[]) ?? []);
  }, [supabase, selected]);

  useEffect(() => {
    void loadCoaches();
  }, [loadCoaches]);

  useEffect(() => {
    void loadTournamentDetail();
  }, [loadTournamentDetail]);

  useEffect(() => {
    if (!tDetail) return;
    setJudgeCode((tDetail.judge_access_code ?? "").trim());
    const per = tDetail.archers_per_bale ?? 4;
    setPerBale(Math.max(1, per));
    const inferred = Math.max(
      1,
      Math.ceil(archers.length / Math.max(1, per)) || 1
    );
    setBalesInput(tDetail.bale_count ?? inferred);
  }, [tDetail, archers.length]);

  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => setMsg(null), 5000);
    return () => window.clearTimeout(t);
  }, [msg]);

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = pin === expectedPin;
    if (!ok) {
      setPinErr("Invalid PIN");
      return;
    }
    localStorage.setItem(ADMIN_KEY, "1");
    setUnlocked(true);
    setPinErr(null);
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_KEY);
    setUnlocked(false);
  };

  const createTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !name.trim()) return;
    const cfg =
      eventType === "CUSTOM"
        ? {
            arrowsPerEnd: customArrows,
            endCount: customEnds,
            maxArrowScore: customMax,
          }
        : getEventConfig(eventType);
    const { error } = await supabase.from("tournaments").insert({
      name: name.trim(),
      date,
      event_type: eventType,
      status: "REGISTRATION",
      arrows_per_end: cfg.arrowsPerEnd,
      end_count: cfg.endCount,
      max_arrow_score: cfg.maxArrowScore,
      archers_per_bale: 4,
      judge_access_code: null,
    });
    if (error) {
      setMsg(error.message);
      if (
        error.message.includes("schema cache") ||
        error.message.includes("Could not find")
      ) {
        setDbError(error.message);
      }
      return;
    }
    setName("");
    setMsg("Tournament created.");
    setDbError(null);
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("date", { ascending: false });
    setTournaments((data as Tournament[]) ?? []);
  };

  const deleteArcher = async (id: string) => {
    if (!supabase) return;
    await supabase
      .from("archers")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    await loadTournamentDetail();
  };

  const deleteTournament = async () => {
    if (!supabase || !selected) return;
    if (
      !confirm(
        "Delete this tournament and ALL related data (archers, scores, coaches)? This cannot be undone."
      )
    ) {
      return;
    }
    const { error } = await supabase.from("tournaments").delete().eq("id", selected);
    if (error) {
      setMsg(error.message);
      return;
    }
    setSelected(null);
    setMsg("Tournament deleted.");
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("date", { ascending: false });
    setTournaments((data as Tournament[]) ?? []);
  };

  const createCoachInvite = async () => {
    if (!supabase || !selected || !newCoachName.trim()) {
      setMsg("Coach name required.");
      return;
    }
    const { data, error } = await supabase
      .from("coaches")
      .insert({
        tournament_id: selected,
        display_name: newCoachName.trim(),
        club: newCoachClub.trim() || null,
      })
      .select()
      .single();
    if (error) {
      setMsg(error.message);
      return;
    }
    setNewCoachName("");
    setNewCoachClub("");
    setMsg("Coach invite created. Copy the link below.");
    await loadCoaches();
    const c = data as Coach;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    void navigator.clipboard?.writeText(
      `${base}/coach/${selected}/${c.invite_token}`
    );
  };

  const downloadResultsCsv = () => {
    if (!selected) return;
    const byArcher = new Map<string, { name: string; division: string | null; total: number; x: number }>();
    for (const a of archers) {
      byArcher.set(a.id, {
        name: a.name,
        division: a.division,
        total: 0,
        x: 0,
      });
    }
    for (const s of scores) {
      if (s.round !== "QUALIFICATION") continue;
      const row = byArcher.get(s.archer_id);
      if (row) {
        row.total += s.end_total;
        row.x += s.x_count;
      }
    }
    const rows = [...byArcher.entries()].map(([, v]) => [
      v.name,
      v.division ?? "",
      v.total,
      v.x,
    ]);
    const csv = rowsToCsv(["Name", "Division", "Total", "X"], rows);
    downloadCsv(`results-${selected}.csv`, csv);
  };

  const markComplete = async () => {
    if (!supabase || !selected) return;
    await supabase
      .from("tournaments")
      .update({ status: "COMPLETE" })
      .eq("id", selected);
    setMsg("Marked complete.");
    const { data } = await supabase.from("tournaments").select("*");
    setTournaments((data as Tournament[]) ?? []);
  };

  const forceBracket = async () => {
    if (!supabase || !selected) return;
    try {
      await adminForceBracketGeneration(supabase, selected, archers);
      setMsg("Elimination matches regenerated.");
      await loadTournamentDetail();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed");
    }
  };

  const saveAccessAndBaleSettings = async () => {
    if (!supabase || !selected) return;
    const { error } = await supabase
      .from("tournaments")
      .update({
        judge_access_code:
          judgeCode.trim() === "" ? null : judgeCode.trim(),
        archers_per_bale: Math.max(1, Math.floor(perBale)),
      })
      .eq("id", selected);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg("Access & target settings saved.");
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("date", { ascending: false });
    setTournaments((data as Tournament[]) ?? []);
  };

  const assignTargets = async () => {
    if (!supabase || !selected) return;
    if (archers.length === 0) {
      setMsg("Register archers first.");
      return;
    }
    const per = Math.max(1, Math.floor(perBale));
    const requested = Math.max(1, Math.floor(balesInput));
    const { assignments, effectiveBaleCount } = assignArchersToBales(
      archers,
      requested,
      per
    );
    const { error: clearErr } = await supabase
      .from("archers")
      .update({ bale_number: null, slot_index: null })
      .eq("tournament_id", selected);
    if (clearErr) {
      setMsg(clearErr.message);
      return;
    }
    for (const row of assignments) {
      const { error } = await supabase
        .from("archers")
        .update({
          bale_number: row.bale_number,
          slot_index: row.slot_index,
        })
        .eq("id", row.archerId);
      if (error) {
        setMsg(error.message);
        return;
      }
    }
    const { error: tourErr } = await supabase
      .from("tournaments")
      .update({ bale_count: effectiveBaleCount })
      .eq("id", selected);
    if (tourErr) {
      setMsg(tourErr.message);
      return;
    }
    await loadTournamentDetail();
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("date", { ascending: false });
    setTournaments((data as Tournament[]) ?? []);
    setMsg("Targets assigned. Open Display → Targets for the field.");
  };

  if (!supabase) {
    return <p className="p-6 text-danger">Configure Supabase env vars.</p>;
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="font-heading text-2xl font-bold">Admin</h1>
        <form onSubmit={unlock} className="mt-6 flex flex-col gap-4">
          <input
            type="password"
            placeholder="PIN"
            className="rounded-lg border border-border bg-surface px-3 py-2"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-xl bg-accent py-3 font-bold text-black"
          >
            Unlock
          </button>
        </form>
        {pinErr && <p className="mt-2 text-sm text-danger">{pinErr}</p>}
      </div>
    );
  }

  const columnMismatch =
    dbError != null &&
    (dbError.includes("column") || dbError.includes("schema cache"));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold">Admin</h1>
        <button type="button" onClick={logout} className="text-sm text-secondary">
          Lock
        </button>
      </div>

      {dbError && (
        <div
          className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-primary"
          role="alert"
        >
          <p className="font-heading font-semibold text-accent">
            {columnMismatch
              ? "Database is missing new columns"
              : "Supabase tables missing"}
          </p>
          <p className="mt-2 text-secondary">{dbError}</p>
          {columnMismatch ? (
            <p className="mt-3 text-secondary">
              Your project was created before target / judge fields were added.
              In Supabase → <strong>SQL Editor</strong>, paste and run{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-accent">
                supabase/run_this_if_columns_missing.sql
              </code>
              . It ends with{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">
                notify pgrst, &apos;reload schema&apos;;
              </code>
              . Then hard-refresh this page. (Do <strong>not</strong> rely on
              schema.sql alone—it does not alter existing tables.)
            </p>
          ) : (
            <p className="mt-3 text-secondary">
              In Supabase → <strong>SQL Editor</strong>, paste and run{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-accent">
                supabase/schema.sql
              </code>
              . Reload this page after that.
            </p>
          )}
        </div>
      )}

      <section className="mt-10 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-heading text-lg font-semibold text-accent">
          New tournament
        </h2>
        <form
          onSubmit={(e) => void createTournament(e)}
          className="mt-4 grid gap-4 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs text-secondary">Name</span>
            <input
              className="rounded border border-border bg-background px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-secondary">Date</span>
            <input
              type="date"
              className="rounded border border-border bg-background px-3 py-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs text-secondary">
              Round format (Indian / WA-style circuit)
            </span>
            <select
              className="rounded border border-border bg-background px-3 py-2"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
            >
              {EVENT_TYPES.map((ev) => (
                <option key={ev} value={ev}>
                  {EVENT_FORMAT_LABELS[ev]}
                </option>
              ))}
            </select>
            <span className="text-[11px] leading-snug text-secondary">
              {EVENT_FORMAT_HINT}
            </span>
          </label>
          {eventType === "CUSTOM" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-secondary">Arrows / end</span>
                <input
                  type="number"
                  min={1}
                  className="rounded border border-border bg-background px-3 py-2"
                  value={customArrows}
                  onChange={(e) => setCustomArrows(+e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-secondary">Ends</span>
                <input
                  type="number"
                  min={1}
                  className="rounded border border-border bg-background px-3 py-2"
                  value={customEnds}
                  onChange={(e) => setCustomEnds(+e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs text-secondary">Max arrow score</span>
                <input
                  type="number"
                  min={1}
                  className="rounded border border-border bg-background px-3 py-2"
                  value={customMax}
                  onChange={(e) => setCustomMax(+e.target.value)}
                />
              </label>
            </>
          )}
          <button
            type="submit"
            className="sm:col-span-2 rounded-xl bg-accent py-3 font-bold text-black"
          >
            Create
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-semibold">Tournaments</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {tournaments.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setSelected(t.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left font-heading transition ${
                  selected === t.id
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface hover:border-accent/40"
                }`}
              >
                {t.name}{" "}
                <span className="font-mono text-xs text-secondary">
                  {t.status}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selected && tDetail && (
        <section className="mt-10 space-y-6">
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-lg border border-border px-4 py-2 text-sm hover:border-accent"
              href={`/judge/${selected}`}
            >
              Judge
            </Link>
            <Link
              className="rounded-lg border border-accent/40 px-4 py-2 text-sm text-accent hover:border-accent"
              href={`/judge/${selected}/roster`}
            >
              Judge roster
            </Link>
            <Link
              className="rounded-lg border border-border px-4 py-2 text-sm hover:border-accent"
              href={`/display/${selected}`}
            >
              Display
            </Link>
            <Link
              className="rounded-lg border border-accent/50 px-4 py-2 text-sm text-accent hover:border-accent"
              href={`/display/${selected}/targets`}
            >
              Targets (field)
            </Link>
            <button
              type="button"
              className="rounded-lg border border-border px-4 py-2 text-sm"
              onClick={() => downloadResultsCsv()}
            >
              Download CSV
            </button>
            <button
              type="button"
              className="rounded-lg border border-accent px-4 py-2 text-sm text-accent"
              onClick={() => void forceBracket()}
            >
              Generate elimination matches
            </button>
            <button
              type="button"
              className="rounded-lg border border-danger/60 px-4 py-2 text-sm text-danger"
              onClick={() => void markComplete()}
            >
              Mark complete
            </button>
            <button
              type="button"
              className="rounded-lg border border-danger px-4 py-2 text-sm font-semibold text-danger"
              onClick={() => void deleteTournament()}
            >
              Delete tournament
            </button>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="font-heading text-md font-semibold text-accent">
              Judge link & targets
            </h3>
            <p className="mt-2 text-xs text-secondary">
              Leave <strong>Judge code</strong> empty for open judge tools (scoring,
              targets, roster). Athletes are added by <strong>coaches</strong> via
              coach invites below — not from the judge register screen. Set a code
              if you want a simple shared gate for judge URLs.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-secondary">
                  Judge access code (optional)
                </span>
                <input
                  className="rounded border border-border bg-background px-3 py-2 font-mono"
                  value={judgeCode}
                  onChange={(e) => setJudgeCode(e.target.value)}
                  placeholder="Empty = open access"
                  autoComplete="off"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-secondary">
                  Archers per bale (line positions)
                </span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  className="rounded border border-border bg-background px-3 py-2"
                  value={perBale}
                  onChange={(e) => setPerBale(+e.target.value || 1)}
                />
              </label>
            </div>
            <button
              type="button"
              className="mt-4 rounded-lg border border-border px-4 py-2 text-sm"
              onClick={() => void saveAccessAndBaleSettings()}
            >
              Save access / bale
            </button>

            <div className="mt-8 border-t border-border pt-6">
              <h4 className="font-heading text-sm font-semibold text-primary">
                Auto-assign bale numbers
              </h4>
              <p className="mt-1 text-xs text-secondary">
                Sorts by division, then name. Fills bale 1 (positions A–…), then bale
                2, etc. Adds bales automatically if there are more archers than fit.
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-secondary">Target bales (minimum)</span>
                  <input
                    type="number"
                    min={1}
                    className="w-24 rounded border border-border bg-background px-3 py-2"
                    value={balesInput}
                    onChange={(e) =>
                      setBalesInput(Math.max(1, +e.target.value || 1))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="rounded-xl bg-accent px-4 py-2 font-heading text-sm font-bold text-black"
                  onClick={() => void assignTargets()}
                >
                  Assign targets
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="font-heading text-md font-semibold text-accent">
              Coach invites (student registration)
            </h3>
            <p className="mt-2 text-xs text-secondary">
              Coaches use a private link — they only see their own athletes. Judges
              and Admin see everyone in Roster. After coaches lock, only judges can
              edit from the Judge → Roster screen.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <input
                className="min-w-[160px] flex-1 rounded border border-border bg-background px-3 py-2"
                placeholder="Coach name"
                value={newCoachName}
                onChange={(e) => setNewCoachName(e.target.value)}
              />
              <input
                className="min-w-[140px] flex-1 rounded border border-border bg-background px-3 py-2"
                placeholder="School / region (optional)"
                value={newCoachClub}
                onChange={(e) => setNewCoachClub(e.target.value)}
              />
              <button
                type="button"
                className="rounded-xl bg-accent px-4 py-2 font-heading text-sm font-bold text-black"
                onClick={() => void createCoachInvite()}
              >
                Create invite
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {coaches.map((c) => {
                const link = origin
                  ? `${origin}/coach/${selected}/${c.invite_token}`
                  : `/coach/${selected}/${c.invite_token}`;
                return (
                  <li
                    key={c.id}
                    className="rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-sm"
                  >
                    <span className="font-heading text-primary">
                      {c.display_name}
                    </span>
                    {c.club && (
                      <span className="text-secondary"> · {c.club}</span>
                    )}
                    {c.locked_at && (
                      <span className="ml-2 text-xs text-accent">· locked</span>
                    )}
                    <div className="mt-1 break-all font-mono text-[10px] text-secondary">
                      {link}
                    </div>
                    <button
                      type="button"
                      className="mt-1 text-xs text-accent hover:underline"
                      onClick={() =>
                        void navigator.clipboard.writeText(link)
                      }
                    >
                      Copy link
                    </button>
                  </li>
                );
              })}
            </ul>
            {coaches.length === 0 && (
              <p className="mt-2 text-xs text-secondary">No coach invites yet.</p>
            )}
          </div>

          <div>
            <h3 className="font-heading text-md font-semibold">Archers</h3>
            <div className="mt-2 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-secondary">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Division</th>
                    <th className="p-2">Bale</th>
                    <th className="p-2">Slot</th>
                    <th className="p-2">School / region</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {archers.map((a) => (
                    <tr key={a.id} className="border-b border-border/60">
                      <td className="p-2">{a.name}</td>
                      <td className="p-2">{a.division}</td>
                      <td className="p-2 font-mono">
                        {a.bale_number ?? "—"}
                      </td>
                      <td className="p-2 font-mono">
                        {a.slot_index != null
                          ? slotLetter(a.slot_index)
                          : "—"}
                      </td>
                      <td className="p-2">{a.club}</td>
                      <td className="p-2">
                        <button
                          type="button"
                          className="text-danger text-xs"
                          onClick={() => void deleteArcher(a.id)}
                        >
                          Trash
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-heading text-md font-semibold">
              Scores (read-only)
            </h3>
            <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-border font-mono text-xs">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-surface">
                  <tr className="text-secondary">
                    <th className="p-2">Archer</th>
                    <th className="p-2">End</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">X</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((s) => {
                    const an = archers.find((x) => x.id === s.archer_id)?.name;
                    return (
                      <tr key={s.id} className="border-t border-border/40">
                        <td className="p-2">{an}</td>
                        <td className="p-2">{s.end_number}</td>
                        <td className="p-2">{s.end_total}</td>
                        <td className="p-2">{s.x_count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {msg && (
        <div
          role="status"
          className="fixed left-1/2 top-20 z-[200] max-w-[min(90vw,28rem)] -translate-x-1/2 rounded-xl border border-accent/40 bg-surface px-4 py-3 text-center text-sm text-primary shadow-lg"
        >
          {msg}
        </div>
      )}
    </div>
  );
}

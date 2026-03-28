"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useArchers } from "@/hooks/useArchers";
import { useTournament } from "@/hooks/useTournament";
import { useSupabase } from "@/components/SupabaseProvider";
import { BOW_LABEL, BOW_TYPES } from "@/lib/categoryGrouper";
import type { AgeCategory, Archer, BowType, Coach, Gender } from "@/lib/types";

const ages: AgeCategory[] = ["U18", "U21", "SENIOR", "MASTER", "VETERAN"];
const genders: Gender[] = ["M", "F", "X"];

function CoachPortalInner({
  tournamentId,
  coach,
}: {
  tournamentId: string;
  coach: Coach;
}) {
  const supabase = useSupabase();
  const { tournament } = useTournament(supabase, tournamentId);
  const { archers, loading, registerArcher, refetch } = useArchers(
    supabase,
    tournamentId,
    { coachId: coach.id }
  );

  const [name, setName] = useState("");
  const [club, setClub] = useState("");
  const [age, setAge] = useState<AgeCategory>("SENIOR");
  const [gender, setGender] = useState<Gender>("M");
  const [bow, setBow] = useState<BowType>("RECURVE");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [localCoach, setLocalCoach] = useState(coach);

  const coachLocked = Boolean(localCoach.locked_at);

  const addArcher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || coachLocked) return;
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
        coach_id: localCoach.id,
      });
      setName("");
      setClub("");
      setMsg("Archer added.");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const removeArcher = async (a: Archer) => {
    if (!supabase || coachLocked || a.registration_locked) return;
    if (!confirm(`Remove ${a.name} from your list?`)) return;
    const { error } = await supabase
      .from("archers")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", a.id)
      .eq("coach_id", localCoach.id);
    if (error) {
      setMsg(error.message);
      return;
    }
    await refetch();
    setMsg("Removed (can be restored by a judge).");
  };

  const lockRoster = async () => {
    if (!supabase || archers.length === 0) {
      setMsg("Add at least one archer before locking.");
      return;
    }
    if (
      !confirm(
        "Lock your roster? You will not be able to add or edit archers after this. A judge can still make changes."
      )
    ) {
      return;
    }
    const now = new Date().toISOString();
    const { error: e1 } = await supabase
      .from("coaches")
      .update({ locked_at: now })
      .eq("id", localCoach.id);
    if (e1) {
      setMsg(e1.message);
      return;
    }
    const { error: e2 } = await supabase
      .from("archers")
      .update({ registration_locked: true })
      .eq("coach_id", localCoach.id)
      .is("deleted_at", null);
    if (e2) {
      setMsg(e2.message);
      return;
    }
    setLocalCoach({ ...localCoach, locked_at: now });
    await refetch();
    setMsg("Roster locked. Thank you.");
  };

  if (!supabase) {
    return <p className="p-6 text-danger">Configure Supabase.</p>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <p className="font-mono text-xs text-secondary">Coach portal · private link</p>
      {tournament && (
        <h1 className="mt-3 font-heading text-2xl font-bold leading-tight text-accent">
          {tournament.name}
        </h1>
      )}
      <h2 className="mt-4 font-heading text-xl font-semibold text-primary">
        {localCoach.display_name}
      </h2>
      {localCoach.club && (
        <p className="text-sm text-secondary">
          School / region (coach): {localCoach.club}
        </p>
      )}
      {coachLocked && (
        <div className="mt-4 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-primary">
          <strong>Roster locked.</strong> Contact a judge to change entries. Judges
          use the Roster screen to update after lock.
        </div>
      )}

      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold text-accent">
          Your archers
        </h2>
        {loading ? (
          <p className="mt-2 text-secondary">Loading…</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {archers.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2"
              >
                <div>
                  <p className="font-heading text-primary">{a.name}</p>
                  <p className="text-xs text-secondary">
                    {a.division}
                    {a.registration_locked ? " · locked" : ""}
                  </p>
                </div>
                {!coachLocked && !a.registration_locked && (
                  <button
                    type="button"
                    className="text-xs text-danger"
                    onClick={() => void removeArcher(a)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {!coachLocked && (
        <form
          onSubmit={(e) => void addArcher(e)}
          className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-[#141414] p-4"
        >
          <h2 className="font-heading text-lg font-semibold">
            Add archer (student)
          </h2>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-secondary">Name</span>
            <input
              required
              className="rounded-lg border border-border bg-background px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-secondary">School / region (optional)</span>
            <input
              className="rounded-lg border border-border bg-background px-3 py-2"
              value={club}
              onChange={(e) => setClub(e.target.value)}
              placeholder="School or region"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-secondary">Age</span>
            <select
              className="rounded-lg border border-border bg-background px-3 py-2"
              value={age}
              onChange={(e) => setAge(e.target.value as AgeCategory)}
            >
              {ages.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-secondary">Gender</span>
            <select
              className="rounded-lg border border-border bg-background px-3 py-2"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
            >
              {genders.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-secondary">Bow</span>
            <select
              className="rounded-lg border border-border bg-background px-3 py-2"
              value={bow}
              onChange={(e) => setBow(e.target.value as BowType)}
            >
              {BOW_TYPES.map((x) => (
                <option key={x} value={x}>
                  {BOW_LABEL[x]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-accent py-3 font-bold text-black disabled:opacity-50"
          >
            Add to roster
          </button>
        </form>
      )}

      {!coachLocked && archers.length > 0 && (
        <button
          type="button"
          className="mt-6 w-full rounded-xl border-2 border-accent py-4 font-heading font-bold uppercase text-accent"
          onClick={() => void lockRoster()}
        >
          Lock roster & submit
        </button>
      )}

      {msg && <p className="mt-4 text-sm text-secondary">{msg}</p>}
    </div>
  );
}

export function CoachPortal({
  tournamentId,
  token,
}: {
  tournamentId: string;
  token: string;
}) {
  /** Avoid hydration mismatches (browser extensions mutate DOM; invite UI depends on client). */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const supabase = useSupabase();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!mounted || !supabase) return;
    void supabase
      .from("coaches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("invite_token", token)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setLoadErr(error.message);
          return;
        }
        if (!data) {
          setLoadErr("Invalid or expired coach invite link.");
          return;
        }
        setCoach(data as Coach);
      });
  }, [mounted, supabase, tournamentId, token]);

  if (!mounted) {
    return (
      <div
        className="min-h-[40vh]"
        suppressHydrationWarning
        aria-busy="true"
      />
    );
  }

  if (!supabase) {
    return <p className="p-6 text-danger">Configure Supabase.</p>;
  }

  if (loadErr) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="text-danger">{loadErr}</p>
        <Link href="/" className="mt-4 inline-block text-accent">
          Home
        </Link>
      </div>
    );
  }

  if (!coach) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center text-secondary"
        suppressHydrationWarning
      >
        Loading coach invite…
      </div>
    );
  }

  return <CoachPortalInner tournamentId={tournamentId} coach={coach} />;
}

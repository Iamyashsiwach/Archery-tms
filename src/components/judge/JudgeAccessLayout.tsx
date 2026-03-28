"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSupabase } from "@/components/SupabaseProvider";

const sessionKey = (tournamentId: string) => `judge_access_${tournamentId}`;

/**
 * Optional tournament.judge_access_code: when null/empty, judge routes are open
 * (anyone with the link). When set, archers & judges enter the same shared code once per browser.
 */
export function JudgeAccessLayout({
  tournamentId,
  children,
}: {
  tournamentId: string;
  children: ReactNode;
}) {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [required, setRequired] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const check = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("tournaments")
      .select("judge_access_code")
      .eq("id", tournamentId)
      .maybeSingle();

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    const code = (data?.judge_access_code as string | null | undefined)?.trim() ?? "";
    if (!code) {
      setOpen(true);
      setRequired(null);
      setLoading(false);
      return;
    }

    setRequired(code);
    const stored = sessionStorage.getItem(sessionKey(tournamentId));
    setOpen(stored === code);
    setLoading(false);
  }, [supabase, tournamentId]);

  useEffect(() => {
    void check();
  }, [check]);

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!required) return;
    if (input.trim() !== required) {
      setErr("Incorrect code. Ask the tournament director.");
      return;
    }
    sessionStorage.setItem(sessionKey(tournamentId), required);
    setOpen(true);
    setErr(null);
  };

  if (!supabase) {
    return (
      <p className="p-6 text-danger">Add Supabase environment variables.</p>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-secondary">
        Loading…
      </div>
    );
  }

  if (err && !open && !required) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="text-danger">{err}</p>
      </div>
    );
  }

  if (!open && required) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-heading text-2xl font-bold text-primary">
          Judge access
        </h1>
        <p className="mt-2 text-sm text-secondary">
          This event uses a shared judge code (players may use the same screen).
          Leave the code empty in Admin for fully open links.
        </p>
        <form onSubmit={unlock} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            autoComplete="off"
            placeholder="Event code"
            className="rounded-lg border border-border bg-surface px-4 py-3 font-mono text-primary"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-xl bg-accent py-3 font-heading font-bold text-black"
          >
            Continue
          </button>
        </form>
        {err && <p className="mt-3 text-sm text-danger">{err}</p>}
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import type { Tournament } from "@/lib/types";

export default function JudgePickPage() {
  const supabase = useSupabase();
  const [rows, setRows] = useState<Tournament[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    setLoadErr(null);
    void supabase
      .from("tournaments")
      .select("*")
      .order("date", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setLoadErr(error.message);
          setRows([]);
          return;
        }
        setRows((data as Tournament[]) ?? []);
      });
  }, [supabase]);

  if (!supabase) {
    return (
      <p className="p-6 text-danger">Add Supabase env vars to load tournaments.</p>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-heading text-2xl font-bold text-primary">Judge</h1>
      <p className="mt-2 text-secondary">Pick a tournament. No admin PIN needed here.</p>
      {loadErr && (
        <p className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {loadErr}
        </p>
      )}
      <ul className="mt-6 flex flex-col gap-2">
        {rows.map((t) => (
          <li key={t.id}>
            <Link
              href={`/judge/${t.id}`}
              className="block rounded-xl border border-border bg-surface px-4 py-4 font-heading text-primary transition hover:border-accent"
            >
              {t.name}
              <span className="mt-1 block font-mono text-xs text-secondary">
                {t.date} · {t.status}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {rows.length === 0 && (
        <p className="mt-8 text-secondary">No tournaments yet. Create one in Admin.</p>
      )}
    </div>
  );
}

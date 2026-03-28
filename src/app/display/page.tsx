"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import type { Tournament } from "@/lib/types";

export default function DisplayPickPage() {
  const supabase = useSupabase();
  const [rows, setRows] = useState<Tournament[]>([]);

  useEffect(() => {
    if (!supabase) return;
    void supabase
      .from("tournaments")
      .select("*")
      .order("date", { ascending: false })
      .then(({ data }) => setRows((data as Tournament[]) ?? []));
  }, [supabase]);

  if (!supabase) {
    return <p className="p-6 text-danger">Configure Supabase.</p>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-heading text-2xl font-bold">Display</h1>
      <p className="text-secondary">Open the public leaderboard.</p>
      <ul className="mt-6 flex flex-col gap-2">
        {rows.map((t) => (
          <li key={t.id}>
            <Link
              className="block rounded-xl border border-border bg-surface px-4 py-4 hover:border-accent"
              href={`/display/${t.id}`}
            >
              {t.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

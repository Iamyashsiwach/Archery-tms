"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createContext, useContext, useState, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const SupabaseCtx = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  });
  return (
    <SupabaseCtx.Provider value={client}>{children}</SupabaseCtx.Provider>
  );
}

export function useSupabase() {
  return useContext(SupabaseCtx);
}

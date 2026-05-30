import { useState, useEffect } from "react";
import type { SurvivorProfile } from "../types/connect.types";
import { getMatches } from "../apis/Connect.api";

interface UseMatchListResult {
  matches: SurvivorProfile[];
  loading: boolean;
}

/**
 * Fetches the current user's matched contacts.
 * Re-fetches whenever `refreshKey` changes (e.g. after a new chat is opened).
 */
export function useMatchList(refreshKey?: string): UseMatchListResult {
  const [matches, setMatches] = useState<SurvivorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      try {
        setLoading(true);
        const data = await getMatches();
        setMatches(data);
      } catch (err) {
        console.error("Failed to load match channels from database:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, [refreshKey]);

  return { matches, loading };
}

import { useState, useEffect } from "react";
import type { SurvivorProfile } from "../types/connect.types";
import { getSurvivors, getMatches, updateLocation } from "../apis/Connect.api";

interface UseMatchMakingFeedResult {
  survivors: SurvivorProfile[];
  matchesCount: number;
  loading: boolean;
}

export function useMatchMakingFeed(): UseMatchMakingFeedResult {
  const [survivors, setSurvivors] = useState<SurvivorProfile[]>([]);
  const [matchesCount, setMatchesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      try {
        setLoading(true);
        const data = await getSurvivors();
        setSurvivors(data);

        const activeMatches = await getMatches();
        setMatchesCount(activeMatches.length);
      } catch (err) {
        console.error("Failed to load nearby survivors feed:", err);
      } finally {
        setLoading(false);
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await updateLocation(position.coords.latitude, position.coords.longitude);
            console.log("GPS Telemetry successfully synced:", position.coords.latitude, position.coords.longitude);
          } catch (err) {
            console.warn("Could not sync real-world coordinates with backend database", err);
          } finally {
            loadFeed();
          }
        },
        (error) => {
          console.warn("Geolocation access denied or timed out:", error);
          loadFeed();
        },
        { timeout: 8000 }
      );
    } else {
      loadFeed();
    }
  }, []);

  return { survivors, matchesCount, loading };
}

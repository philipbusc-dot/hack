// Risk-factor acquisition layer.
//
// Turns a region (country + coordinates) into the five survival factors the
// canonical formula consumes, each from its designated source:
//
//   infectionRate     — Disease.sh  (live, no key)        active & critical cases
//   humidity          — Open-Meteo  (live, coordinate)    real-time RH%
//   populationDensity — REST Countries + local seed        hybrid
//   airportTraffic    — OpenFlights hub table (static)     nearest-hub index
//   hospitalPressure  — derived in-backend                 stress sim off cases
//
// Every live call degrades gracefully: a failed upstream falls back to a seed
// or neutral value and is reported in `sources` so the result is never an error.

import { fetchJson } from "../../../lib/fetchJson";
import { nearestHub } from "../data/airportHubs";
import { seedDensity } from "../data/populationSeed";
import type { RegionInput, RiskFactors } from "../types/region.types";

interface DiseaseShCountry {
  country: string;
  cases: number;
  active: number;
  critical: number;
  population: number;
  casesPerOneMillion: number;
}

interface OpenMeteoResponse {
  current?: { relative_humidity_2m?: number };
}

interface RestCountry {
  population?: number;
  area?: number;
}

export type FactorSource = "live" | "seed" | "derived" | "fallback";

export interface FactorResult {
  factors: RiskFactors;
  sources: Record<keyof RiskFactors, FactorSource>;
  meta: {
    diseaseShCountry?: string;
    nearestAirport?: string;
    nearestAirportKm?: number;
  };
}

async function getInfection(country: string): Promise<{
  infectionRate: number;
  source: FactorSource;
  raw?: DiseaseShCountry;
}> {
  try {
    const data = await fetchJson<DiseaseShCountry>(
      `https://disease.sh/v3/covid-19/countries/${encodeURIComponent(
        country
      )}?strict=true`
    );
    const pop = data.population > 0 ? data.population : 1;
    const activePer100k = (data.active / pop) * 100_000;
    const criticalShare = data.active > 0 ? data.critical / data.active : 0;
    const infectionRate =
      Math.round(
        Math.min(50, activePer100k / 50 + criticalShare * 20) * 100
      ) / 100;
    return { infectionRate, source: "live", raw: data };
  } catch {
    // Neutral low-outbreak baseline when the feed is unreachable.
    return { infectionRate: 1, source: "fallback" };
  }
}

function deriveHospitalPressure(raw?: DiseaseShCountry): {
  hospitalPressure: number;
  source: FactorSource;
} {
  if (!raw || raw.population <= 0) {
    return { hospitalPressure: 35, source: "fallback" };
  }
  const icuBeds = raw.population * 0.00025;
  const occupancy = icuBeds > 0 ? (raw.critical / icuBeds) * 100 : 0;
  const activePer100k = (raw.active / raw.population) * 100_000;
  const hospitalPressure =
    Math.round(Math.min(160, occupancy + activePer100k * 0.02) * 10) / 10;
  return { hospitalPressure, source: "derived" };
}

async function getHumidity(
  lat: number,
  lng: number
): Promise<{ humidity: number; source: FactorSource }> {
  try {
    const data = await fetchJson<OpenMeteoResponse>(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&current=relative_humidity_2m`
    );
    const rh = data.current?.relative_humidity_2m;
    if (typeof rh === "number" && Number.isFinite(rh)) {
      return { humidity: Math.round(rh * 10) / 10, source: "live" };
    }
    return { humidity: 60, source: "fallback" };
  } catch {
    return { humidity: 60, source: "fallback" };
  }
}

async function getDensity(
  country: string
): Promise<{ populationDensity: number; source: FactorSource }> {
  try {
    const arr = await fetchJson<RestCountry[]>(
      `https://restcountries.com/v3.1/alpha/${encodeURIComponent(
        country
      )}?fields=population,area`
    );
    const c = Array.isArray(arr) ? arr[0] : (arr as unknown as RestCountry);
    if (c?.population && c.area && c.area > 0) {
      return {
        populationDensity: Math.round((c.population / c.area) * 10) / 10,
        source: "live",
      };
    }
    return { populationDensity: seedDensity(country), source: "seed" };
  } catch {
    return { populationDensity: seedDensity(country), source: "seed" };
  }
}

export async function resolveFactors(input: RegionInput): Promise<FactorResult> {
  const { country, lat, lng } = input;

  const [infection, humidity, density] = await Promise.all([
    getInfection(country),
    getHumidity(lat, lng),
    getDensity(country),
  ]);

  const hospital = deriveHospitalPressure(infection.raw);
  const hub = nearestHub(lat, lng);

  return {
    factors: {
      infectionRate: infection.infectionRate,
      humidity: humidity.humidity,
      populationDensity: density.populationDensity,
      airportTraffic: hub.trafficIndex,
      hospitalPressure: hospital.hospitalPressure,
    },
    sources: {
      infectionRate: infection.source,
      humidity: humidity.source,
      populationDensity: density.source,
      airportTraffic: "seed",
      hospitalPressure: hospital.source,
    },
    meta: {
      diseaseShCountry: infection.raw?.country,
      nearestAirport: `${hub.hub.name} (${hub.hub.iata})`,
      nearestAirportKm: hub.distanceKm,
    },
  };
}

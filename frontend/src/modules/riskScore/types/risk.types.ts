// Shapes mirroring the backend's POST /regions/calculate response
// (see backend/src/modules/riskScore). Factors are sourced server-side; the
// client only identifies the region it wants scored.

/** The five survival factors that drive a region's danger score. */
export interface RiskFactors {
  infectionRate: number; // outbreak intensity (Disease.sh)
  humidity: number; // real-time relative humidity % (Open-Meteo)
  populationDensity: number; // people per km² (REST Countries + seed)
  airportTraffic: number; // nearest-hub travel index 0–100 (OpenFlights)
  hospitalPressure: number; // derived ICU-stress simulation 0–160
}

export type FactorSource = "live" | "seed" | "derived" | "fallback";

export type DangerLevel = "LOW" | "MODERATE" | "HIGH";

/** What identifies a region for live scoring. */
export interface RegionInput {
  country: string; // ISO alpha-2 code or country name (e.g. "TH" / "Thailand")
  lat: number;
  lng: number;
}

/** Response body of POST /regions/calculate. */
export interface RegionRiskPreview {
  factors: RiskFactors;
  sources: Record<keyof RiskFactors, FactorSource>;
  meta: {
    diseaseShCountry?: string;
    nearestAirport?: string;
    nearestAirportKm?: number;
  };
  regionalScore: number; // 0–100
  dangerLevel: DangerLevel;
}

export const RISK_CONSTANTS = {
  k: 0.05,
  alpha: 0.01,
  beta: 0.1,
};

export interface RegionRiskFactors {
  infectionRate: number;
  populationDensity: number;
  airportTraffic: number;
  humidity: number;
  hospitalStrain: number;
}

export function survivalIndex(hospitalStrain: number): number {
  const { k } = RISK_CONSTANTS;
  return 1.5 / (1 + Math.exp(-k * (hospitalStrain - 100)));
}
export function computeRegionalRisk(f: RegionRiskFactors): number {
  const { alpha, beta } = RISK_CONSTANTS;
  const p = Math.max(1, f.populationDensity); 
  const core =
    f.infectionRate * Math.log(p) * (1 + alpha * f.airportTraffic);
  const r = core * survivalIndex(f.hospitalStrain) + beta * f.humidity;
  return Math.round(Math.min(100, Math.max(0, r)) * 10) / 10;
}

export function computePSI(regionalRisk: number, d: number): number {
  const reduction = 40 * (1 - Math.exp(-0.1 * Math.max(0, d)));
  return Math.round(Math.max(0, regionalRisk - reduction) * 10) / 10;
}

export const PERSONAL_CONSTANTS = {
  mitigationCap: 40,
  decayK: 0.15,
};

export function computeResourceMitigation(limitingDays: number): number {
  const { mitigationCap, decayK } = PERSONAL_CONSTANTS;
  const d = Math.max(0, limitingDays);
  return Math.round(mitigationCap * (1 - Math.exp(-decayK * d)) * 10) / 10;
}

export function riskToDanger(score: number): "LOW" | "MODERATE" | "HIGH" {
  if (score >= 66) return "HIGH";
  if (score >= 33) return "MODERATE";
  return "LOW";
}

export function classifyCountryDanger(input: {
  infectedCount: number;
  deathCount: number;
  population?: number;
  casesPerOneMillion?: number;
}): "LOW" | "MODERATE" | "HIGH" {
  const cpm =
    input.casesPerOneMillion ??
    (input.population && input.population > 0
      ? (input.infectedCount / input.population) * 1_000_000
      : 0);
  const cfr =
    input.infectedCount > 0 ? input.deathCount / input.infectedCount : 0;

  const loadScore = Math.min(70, (cpm / 300_000) * 70);
  const cfrScore = Math.min(30, (cfr / 0.03) * 30);
  const score = loadScore + cfrScore;

  if (score >= 55) return "HIGH";
  if (score >= 28) return "MODERATE";
  return "LOW";
}

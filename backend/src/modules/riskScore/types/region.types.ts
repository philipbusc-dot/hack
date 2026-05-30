export interface RiskFactors {
  infectionRate: number;
  humidity: number; 
  populationDensity: number;
  airportTraffic: number;
  hospitalPressure: number;
}

export interface RegionInput {
  country: string;
  lat: number;
  lng: number;
}

export interface RegionRisk extends RiskFactors, RegionInput {
  id: string;
  regionalScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DangerLevel = "LOW" | "MODERATE" | "HIGH";

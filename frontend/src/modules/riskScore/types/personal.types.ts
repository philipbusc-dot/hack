export type DangerLevel = "LOW" | "MODERATE" | "HIGH";

export interface SurvivalStat {
  id: string;
  name: string;
  value: number;
  userId: string;
}

export interface SurvivalStatInput {
  name: string;
  value: number;
}


export interface PersonalRiskResult {
  regionalScore: number; 
  limitingDays: number | null;
  limitingStat: string | null;
  resourceMitigation: number;
  psi: number;
  dangerLevel: DangerLevel;
  stats: SurvivalStat[];
}

export type DangerLevel = "LOW" | "MODERATE" | "HIGH";

export interface SurvivalStatInput {
  name: string;
  value: number;
}

export interface SurvivalStat extends SurvivalStatInput {
  id: string;
  userId: string;
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

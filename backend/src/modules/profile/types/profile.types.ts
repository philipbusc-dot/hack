// Profile feature — the authenticated user's editable profile + statistics.

export interface ProfileStat {
  id: string;
  name: string;
  value: number;
  unit: string;
}

export interface Profile {
  id: string;
  email: string;
  username: string;
  description: string | null;
  photoUrl: string | null;
  role: "admin" | "survivor";
  /** The user's survival statistics (shared with the RiskFactor feature). */
  stats: ProfileStat[];
}

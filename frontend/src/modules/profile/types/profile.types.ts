// Profile feature — mirrors the backend /profile responses.

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
  stats: ProfileStat[];
}

/** PATCH /profile body — name maps to username, about maps to description. */
export interface ProfileUpdateInput {
  username?: string;
  description?: string;
}

/** Create/update body for a single statistic. */
export interface StatInput {
  name: string;
  value: number;
  unit?: string;
}

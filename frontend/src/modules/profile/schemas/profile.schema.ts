// Lightweight client-side validation (the frontend has no zod). Mirrors the
// backend constraints so the user gets fast feedback before the request.

/** Returns an error message, or null if the name is valid. */
export function validateName(name: string): string | null {
  const n = name.trim();
  if (n.length < 3) return "Name must be at least 3 characters.";
  if (n.length > 24) return "Name must be at most 24 characters.";
  if (!/^[a-zA-Z0-9_]+$/.test(n))
    return "Name may only contain letters, numbers, and underscores.";
  return null;
}

/** Returns an error message, or null if the about text is valid. */
export function validateAbout(about: string): string | null {
  if (about.trim().length > 300) return "About must be at most 300 characters.";
  return null;
}

/** Returns an error message, or null if the statistic is valid. */
export function validateStat(
  name: string,
  value: number,
  unit: string
): string | null {
  if (!name.trim()) return "Statistic name is required.";
  if (!Number.isFinite(value) || value < 0 || value > 3650)
    return "Value must be a number between 0 and 3650.";
  if (!unit.trim() || unit.trim().length > 20)
    return "Unit is required (max 20 characters).";
  return null;
}

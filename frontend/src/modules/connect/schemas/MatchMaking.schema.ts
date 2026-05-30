import type { SurvivorProfile, SwipeStatus, SwipeRequest, UpdateLocationRequest } from "../types/connect.types";

// ─── Swipe Request Validation ─────────────────────────────────────────────────

const VALID_SWIPE_STATUSES: SwipeStatus[] = ["like", "love", "no"];

/**
 * Validates a swipe payload before it is sent to the API.
 * Throws a descriptive error if validation fails.
 */
export function validateSwipeRequest(payload: unknown): SwipeRequest {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Swipe payload must be an object.");
  }
  const p = payload as Record<string, unknown>;

  if (typeof p.receiverId !== "string" || p.receiverId.trim() === "") {
    throw new Error("receiverId must be a non-empty string.");
  }

  if (!VALID_SWIPE_STATUSES.includes(p.status as SwipeStatus)) {
    throw new Error(`status must be one of: ${VALID_SWIPE_STATUSES.join(", ")}.`);
  }

  return { receiverId: p.receiverId, status: p.status as SwipeStatus };
}

// ─── Location Update Validation ───────────────────────────────────────────────

/**
 * Validates a location update payload before it is sent to the API.
 * Throws a descriptive error if coordinates are out of range.
 */
export function validateUpdateLocation(payload: unknown): UpdateLocationRequest {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Location payload must be an object.");
  }
  const p = payload as Record<string, unknown>;

  const lat = Number(p.latitude);
  const lon = Number(p.longitude);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    throw new Error("latitude must be a number between -90 and 90.");
  }
  if (isNaN(lon) || lon < -180 || lon > 180) {
    throw new Error("longitude must be a number between -180 and 180.");
  }

  return { latitude: lat, longitude: lon };
}

// ─── Survivor Profile Shape Guard ─────────────────────────────────────────────

/**
 * Validates that an API response object has the minimum required shape
 * of a SurvivorProfile. Useful for runtime data integrity checks.
 */
export function isSurvivorProfile(value: unknown): value is SurvivorProfile {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.bio === "string" &&
    typeof v.survivorClass === "string" &&
    typeof v.baseLocation === "string" &&
    typeof v.avatarUrl === "string" &&
    typeof v.distance === "string"
  );
}

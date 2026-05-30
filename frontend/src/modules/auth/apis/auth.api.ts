import api from "../../../api";
import type { User } from "../types/auth.types";

/** POST /auth/signup — creates a survivor account and logs in (sets cookie). */
export async function apiSignup(
  email: string,
  username: string,
  password: string
): Promise<User> {
  const { data } = await api.post<User>("/auth/signup", {
    email,
    username,
    password,
  });
  return data;
}

/** POST /auth/login — identifier is an email OR a username. */
export async function apiLogin(
  identifier: string,
  password: string
): Promise<User> {
  const { data } = await api.post<User>("/auth/login", { identifier, password });
  return data;
}

/** POST /auth/logout — clears the cookie. */
export async function apiLogout(): Promise<void> {
  await api.post("/auth/logout");
}

/** GET /auth/me — current user, or null if not authenticated. */
export async function apiMe(): Promise<User | null> {
  try {
    const { data } = await api.get<User>("/auth/me");
    return data;
  } catch {
    return null;
  }
}

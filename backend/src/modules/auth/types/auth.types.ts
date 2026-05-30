// Authentication contracts.

export type Role = "admin" | "survivor";

/** A user as exposed to clients — never includes the password hash. */
export interface PublicUser {
  id: string;
  email: string;
  username: string;
  role: Role;
  createdAt: Date;
}

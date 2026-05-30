// Authentication contracts (frontend).

export type Role = "admin" | "survivor";

export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  createdAt: string;
}

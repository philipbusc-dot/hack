import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import { apiLogin, apiSignup, apiLogout, apiMe } from "../apis/auth.api";
import type { User } from "../types/auth.types";

interface AuthValue {
  user: User | null;
  /** True until the initial /me check resolves. */
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Pull a human-readable message out of an axios error. */
function extractMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const m = e.response?.data?.message;
    if (typeof m === "string") return m;
  }
  return "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on load (the cookie, if any, is sent automatically).
  useEffect(() => {
    apiMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  async function login(identifier: string, password: string) {
    try {
      setUser(await apiLogin(identifier, password));
    } catch (e) {
      throw new Error(extractMessage(e));
    }
  }

  async function signup(email: string, username: string, password: string) {
    try {
      setUser(await apiSignup(email, username, password));
    } catch (e) {
      throw new Error(extractMessage(e));
    }
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

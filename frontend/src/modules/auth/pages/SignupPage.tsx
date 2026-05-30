import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Panel, Spinner, Notice } from "../../../components/ui";
import StatusLine from "../../../components/StatusLine";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "w-full rounded-[12px] border border-line2 bg-surface2 px-3.5 py-2.5 text-[14.5px] text-ink outline-none transition placeholder:text-faint focus:border-lime";

/** Light client-side checks; the server is the source of truth. */
function clientError(email: string, username: string, password: string): string {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email.";
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username))
    return "Username: 3–24 letters, numbers, or underscores.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return "";
}

export default function SignupPage() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/ai" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const localError = clientError(email.trim(), username.trim(), password);
    if (localError) {
      setError(localError);
      return;
    }
    setError("");
    setBusy(true);
    try {
      await signup(email.trim(), username.trim(), password);
      navigate("/ai");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-5 py-10">
      <StatusLine className="mb-6 justify-center" />
      <Panel className="p-7">
        <h1 className="text-[28px] font-extrabold leading-none text-head">
          Join SafeHAIVN
        </h1>
        <p className="mt-2 text-sm text-muted">
          Create a survivor account to access your briefing.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-muted">Email</span>
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-muted">Username</span>
            <input
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="survivor_01"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-muted">Password</span>
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </label>

          {error && <Notice tone="danger">{error}</Notice>}

          <button
            type="submit"
            disabled={busy || !email || !username || !password}
            className="mt-1 flex items-center justify-center gap-2 rounded-[12px] bg-lime py-2.5 font-semibold text-accent-ink shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Spinner />} Create account
          </button>
        </form>

        <p className="mt-5 text-center text-[13px] text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-lime hover:underline">
            Sign in
          </Link>
        </p>
      </Panel>
    </main>
  );
}

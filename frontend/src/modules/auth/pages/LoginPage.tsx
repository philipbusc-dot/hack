import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Panel, Spinner, Notice } from "../../../components/ui";
import StatusLine from "../../../components/StatusLine";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "w-full rounded-[12px] border border-line2 bg-surface2 px-3.5 py-2.5 text-[14.5px] text-ink outline-none transition placeholder:text-faint focus:border-lime";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/ai" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(identifier.trim(), password);
      navigate("/ai");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-5 py-10">
      <StatusLine className="mb-6 justify-center" />
      <Panel className="p-7">
        <h1 className="text-[28px] font-extrabold leading-none text-head">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to access your SafeHAIVN briefing.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-muted">Email or username</span>
            <input
              className={inputClass}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-muted">Password</span>
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>

          {error && <Notice tone="danger">{error}</Notice>}

          <button
            type="submit"
            disabled={busy || !identifier.trim() || !password}
            className="mt-1 flex items-center justify-center gap-2 rounded-[12px] bg-lime py-2.5 font-semibold text-accent-ink shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Spinner />} Sign in
          </button>
        </form>

        <p className="mt-5 text-center text-[13px] text-muted">
          No account?{" "}
          <Link to="/signup" className="text-lime hover:underline">
            Create one
          </Link>
        </p>
      </Panel>
    </main>
  );
}

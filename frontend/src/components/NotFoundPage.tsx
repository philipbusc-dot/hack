import { Link } from "react-router-dom";
import { Panel, MonoLabel } from "./ui";
import StatusLine from "./StatusLine";

/**
 * App-wide 404. Matches the SafeHAIVN command-center theme (dark panel,
 * lime accents, mono labels, scan-line flourish). Reachable logged in or out
 * via the catch-all route, so it links back to the Map as a safe anchor.
 */
export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[80vh] w-full min-w-0 max-w-md flex-col items-center justify-center px-5 py-10 text-center">
      <StatusLine label="SAFEHAIVN · SIGNAL LOST" className="mb-6 justify-center" />

      <Panel label="ERROR // 404" className="relative w-full overflow-hidden p-8">
        {/* Sweeping scan line — the app's signature command-center flourish. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-px bg-lime/50 animate-scan shadow-glow"
        />

        <MonoLabel className="text-statusdim">Sector not found</MonoLabel>

        <h1
          className="mt-3 font-sans text-[88px] font-extrabold leading-none text-head"
          style={{ textShadow: "0 0 28px rgba(164,210,51,0.35)" }}
        >
          404
        </h1>

        <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-muted">
          This sector is off the grid. The coordinates you requested don&apos;t
          match any known safe zone in the SafeHAIVN network.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/map"
            className="rounded-chip bg-lime px-5 py-2.5 font-semibold text-accent-ink shadow-glow transition hover:brightness-110"
          >
            Return to Map
          </Link>
          <Link
            to="/ai"
            className="rounded-chip border border-line2 bg-surface2 px-5 py-2.5 font-medium text-muted transition hover:text-ink"
          >
            Ask the Assistant
          </Link>
        </div>
      </Panel>

      <MonoLabel className="mt-6 text-faint">Stay sheltered. Stay alive.</MonoLabel>
    </main>
  );
}

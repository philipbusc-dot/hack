import type { BriefingMode } from "../types/ai.types";

export const VIEWS: { id: BriefingMode; label: string; corner: string }[] = [
  { id: "chat", label: "SafeHAIVN Chatbot", corner: "CHATBOT // CONTENT AREA" },
  {
    id: "actions",
    label: "Recommended Actions",
    corner: "ACTIONS // CONTENT AREA",
  },
  {
    id: "evacuation",
    label: "Evacuation Advisory",
    corner: "EVAC // CONTENT AREA",
  },
];

/** Vertical nav list (desktop sidebar) of the three AI views. */
export function ViewNavList({
  active,
  onChange,
}: {
  active: BriefingMode;
  onChange: (v: BriefingMode) => void;
}) {
  return (
    <nav className="flex flex-col gap-2.5">
      {VIEWS.map((v) => {
        const isActive = v.id === active;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange(v.id)}
            className={`w-full rounded-chip border px-4 py-3 text-left text-sm font-medium transition ${
              isActive
                ? "border-[#c7ee54] bg-accent text-accent-ink shadow-glow"
                : "border-line bg-panel text-muted hover:border-line2 hover:text-ink"
            }`}
          >
            {v.label}
          </button>
        );
      })}
    </nav>
  );
}

/** Horizontal-scroll pill tabs (mobile). */
export function ViewNavTabs({
  active,
  onChange,
}: {
  active: BriefingMode;
  onChange: (v: BriefingMode) => void;
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {VIEWS.map((v) => {
        const isActive = v.id === active;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange(v.id)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium transition ${
              isActive
                ? "border-[#c7ee54] bg-accent text-accent-ink shadow-glow"
                : "border-line bg-panel text-muted hover:text-ink"
            }`}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}

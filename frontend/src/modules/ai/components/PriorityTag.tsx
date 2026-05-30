import type { ActionPriority } from "../types/ai.types";

const STYLES: Record<ActionPriority, string> = {
  NOW: "bg-now-bg border-now-bd text-now-tx",
  SOON: "bg-soon-bg border-soon-bd text-soon-tx",
  MONITOR: "bg-mon-bg border-mon-bd text-mon-tx",
};

/** Priority pill (mono, uppercase) for Recommended Actions rows. */
export default function PriorityTag({
  priority,
}: {
  priority: ActionPriority;
}) {
  return (
    <span
      className={`inline-block shrink-0 rounded-chip border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${STYLES[priority]}`}
    >
      {priority}
    </span>
  );
}

import type { ReactNode } from "react";

/**
 * Render a tiny whitelisted markup dialect used in chat bubbles & route steps:
 *   **bold** → text-head, [danger]…[/danger] → text-danger, [lime]…[/lime] →
 *   text-lime. No raw HTML is injected (XSS-safe — we tokenize, never
 *   dangerouslySetInnerHTML).
 */
type Token = { type: "text" | "bold" | "danger" | "lime"; value: string };

const PATTERN =
  /\*\*(.+?)\*\*|\[danger\](.+?)\[\/danger\]|\[lime\](.+?)\[\/lime\]/g;

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  PATTERN.lastIndex = 0;
  while ((m = PATTERN.exec(input)) !== null) {
    if (m.index > last) {
      tokens.push({ type: "text", value: input.slice(last, m.index) });
    }
    if (m[1] !== undefined) tokens.push({ type: "bold", value: m[1] });
    else if (m[2] !== undefined) tokens.push({ type: "danger", value: m[2] });
    else if (m[3] !== undefined) tokens.push({ type: "lime", value: m[3] });
    last = m.index + m[0].length;
  }
  if (last < input.length) {
    tokens.push({ type: "text", value: input.slice(last) });
  }
  return tokens;
}

export default function RichText({ text }: { text: string }) {
  const tokens = tokenize(text);
  return (
    <>
      {tokens.map((t, i): ReactNode => {
        if (t.type === "bold")
          return (
            <strong key={i} className="font-semibold text-head">
              {t.value}
            </strong>
          );
        if (t.type === "danger")
          return (
            <span key={i} className="font-semibold text-danger">
              {t.value}
            </span>
          );
        if (t.type === "lime")
          return (
            <span key={i} className="font-semibold text-lime">
              {t.value}
            </span>
          );
        return <span key={i}>{t.value}</span>;
      })}
    </>
  );
}

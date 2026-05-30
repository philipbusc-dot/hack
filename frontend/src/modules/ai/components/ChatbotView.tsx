import { useEffect, useRef, useState } from "react";
import { Spinner } from "../../../components/ui";
import { generateChat } from "../apis/ai.api";
import RichText from "./RichText";
import type { ChatMessage, ChatTurn } from "../types/ai.types";
import {
  loadConversations,
  saveConversations,
  deriveTitle,
  type Conversation,
} from "../lib/chatStorage";

const CHIPS = ["What should I pack?", "Nearest safe zone?", "How does it spread?"];

/** Opening greeting shown on load and after "New Chat". */
const GREETING =
  "Briefing online. You're in **Bangkok**, currently rated [danger]HIGH threat[/danger]. Ask me anything about the outbreak, or switch views for an actionable checklist or your evacuation route.";

/** A fresh thread containing only the AI greeting. */
function initialMessages(): ChatMessage[] {
  return [{ id: "greeting", role: "ai", html: GREETING }];
}

function newConversation(): Conversation {
  return {
    id: `c-${Date.now()}`,
    title: "New chat",
    messages: initialMessages(),
    updatedAt: Date.now(),
  };
}

/** Saved conversations on first render, or a single fresh chat if none. */
function loadInitial(): Conversation[] {
  const saved = loadConversations();
  return saved.length > 0 ? saved : [newConversation()];
}

function Avatar({ role }: { role: ChatMessage["role"] }) {
  if (role === "ai") {
    return (
      <div
        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-lime text-[12px] font-bold text-accent-ink shadow-glow"
        aria-hidden
      >
        AI
      </div>
    );
  }
  return (
    <div
      className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-line2 bg-surface2 text-[12px] font-semibold text-muted"
      aria-hidden
    >
      U
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <Avatar role={msg.role} />
      <div
        className={`max-w-[78%] rounded-[14px] border px-4 py-3 text-[14.5px] leading-relaxed ${
          isUser
            ? "border-line2 bg-surface2 text-ink"
            : "border-line bg-surface text-ink"
        }`}
      >
        {msg.pending ? (
          <span className="flex items-center gap-2 text-muted">
            <Spinner /> Analyzing threat data…
          </span>
        ) : (
          <>
            <RichText text={msg.html} />
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 border-t border-line pt-2 text-[11px] text-faint">
                <span className="font-mono uppercase tracking-[0.14em]">
                  Knowledge base:
                </span>{" "}
                {msg.sources.join(" · ")}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ChatbotView() {
  const [conversations, setConversations] = useState<Conversation[]>(loadInitial);
  const [activeId, setActiveId] = useState<string>(
    () => conversations[0]?.id ?? ""
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId);
  const messages = active?.messages ?? [];
  const hasUserMessage = messages.some((m) => m.role === "user");
  const lastMsg = messages[messages.length - 1];

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [activeId, messages.length, lastMsg?.html, lastMsg?.pending]);

  /** Update the active conversation's messages and persist. */
  function setActiveMessages(updater: (prev: ChatMessage[]) => ChatMessage[]) {
    setConversations((prev) => {
      const next = prev.map((c) => {
        if (c.id !== activeId) return c;
        const msgs = updater(c.messages);
        return {
          ...c,
          messages: msgs,
          title: deriveTitle(msgs),
          updatedAt: Date.now(),
        };
      });
      saveConversations(next);
      return next;
    });
  }

  function newChat() {
    if (busy) return;
    const convo = newConversation();
    setConversations((prev) => {
      const next = [convo, ...prev];
      saveConversations(next);
      return next;
    });
    setActiveId(convo.id);
    setInput("");
  }

  function selectChat(id: string) {
    if (busy) return;
    setActiveId(id);
    setInput("");
  }

  function deleteChat(id: string) {
    if (busy) return;
    setConversations((prev) => {
      let next = prev.filter((c) => c.id !== id);
      if (next.length === 0) next = [newConversation()];
      saveConversations(next);
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    setBusy(true);

    // Send the recent thread so the bot has short-term memory of the chat.
    const history: ChatTurn[] = messages
      .filter((m) => !m.pending && m.html.trim().length > 0)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.html }));

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      html: trimmed,
    };
    const pendingId = `p-${Date.now()}`;
    setActiveMessages((prev) => [
      ...prev,
      userMsg,
      { id: pendingId, role: "ai", html: "", pending: true },
    ]);

    try {
      const res = await generateChat(trimmed, history);
      setActiveMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { id: pendingId, role: "ai", html: res.reply, sources: res.sources }
            : m
        )
      );
    } catch {
      setActiveMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                id: pendingId,
                role: "ai",
                html: "[danger]Signal lost.[/danger] Couldn't reach the briefing system — check the backend and retry.",
              }
            : m
        )
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* History bar: saved chats + New Chat */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] transition ${
                c.id === activeId
                  ? "border-line2 bg-surface2 text-ink"
                  : "border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              <button
                type="button"
                onClick={() => selectChat(c.id)}
                disabled={busy}
                className="max-w-[140px] truncate disabled:cursor-not-allowed"
                title={c.title}
              >
                {c.title}
              </button>
              <button
                type="button"
                onClick={() => deleteChat(c.id)}
                disabled={busy}
                aria-label="Delete chat"
                className="text-faint transition hover:text-danger disabled:cursor-not-allowed"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={newChat}
          disabled={busy || !hasUserMessage}
          className="shrink-0 rounded-full border border-line bg-surface2 px-3 py-1.5 text-[12px] text-muted transition hover:border-line2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          ＋ New
        </button>
      </div>

      {/* Thread */}
      <div
        ref={scrollRef}
        className="flex max-h-[460px] min-h-[320px] flex-1 flex-col gap-4 overflow-y-auto pr-1"
      >
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
      </div>

      {/* Suggestion chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            disabled={busy}
            onClick={() => send(c)}
            className="rounded-full border border-line bg-surface2 px-3 py-1.5 text-[12px] text-muted transition hover:border-line2 hover:text-ink disabled:opacity-50"
          >
            {c}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form
        className="mt-3 flex items-center gap-2 rounded-[15px] border border-line2 bg-surface2 px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask SafeHAIVN…"
          className="flex-1 bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
          aria-label="Ask SafeHAIVN"
        />
        <button
          type="submit"
          disabled={busy || input.trim().length === 0}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-[18px] font-bold text-accent-ink shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ↑
        </button>
      </form>
    </div>
  );
}

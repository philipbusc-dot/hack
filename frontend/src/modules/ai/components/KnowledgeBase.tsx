import { useEffect, useState } from "react";
import { Panel, MonoLabel, Spinner, Notice } from "../../../components/ui";
import {
  fetchKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
} from "../apis/ai.api";
import { validateKnowledge } from "../schemas/ai.schema";
import type {
  CreateKnowledgeInput,
  KnowledgeArticle,
} from "../types/ai.types";

const EMPTY_DRAFT: CreateKnowledgeInput = {
  title: "",
  content: "",
  category: "Survival Guide",
  source: "SafeHAIVN Field Manual",
};

function Field({
  label,
  value,
  onChange,
  error,
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  textarea?: boolean;
  placeholder?: string;
}) {
  const cls =
    "w-full rounded-chip border bg-surface2 px-3 py-2 text-[13.5px] text-ink outline-none placeholder:text-faint transition focus:border-line2 " +
    (error ? "border-danger/60" : "border-line");
  return (
    <label className="flex flex-col gap-1">
      <MonoLabel className="text-faint">{label}</MonoLabel>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${cls} resize-y`}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
      {error && <span className="text-[11.5px] text-danger">{error}</span>}
    </label>
  );
}

export default function KnowledgeBase() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CreateKnowledgeInput>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const errors = validateKnowledge(draft);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setArticles(await fetchKnowledge());
    } catch {
      setError("Couldn't load the knowledge base.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startNew() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError(null);
  }

  function startEdit(a: KnowledgeArticle) {
    setEditingId(a.id);
    setDraft({
      title: a.title,
      content: a.content,
      category: a.category,
      source: a.source,
    });
    setFormError(null);
  }

  async function handleSave() {
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        const updated = await updateKnowledge(editingId, draft);
        setArticles((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a))
        );
      } else {
        const created = await createKnowledge(draft);
        setArticles((prev) => [created, ...prev]);
      }
      startNew();
    } catch {
      setFormError("Save failed. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteKnowledge(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      if (editingId === id) startNew();
    } catch {
      setError("Delete failed. Try again.");
    }
  }

  return (
    <Panel label="KNOWLEDGE // BASE" className="mt-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <MonoLabel className="text-statusdim">KNOWLEDGE BASE</MonoLabel>
          <h3 className="mt-1 text-[18px] font-bold text-head">
            Pandemic History & Survival Guides
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-chip border border-line2 px-3 py-1.5 text-[13px] text-muted transition hover:text-ink"
        >
          {open ? "Hide" : `Show (${articles.length})`}
        </button>
      </div>

      {open && (
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* List */}
          <div className="flex flex-col gap-2.5">
            {loading ? (
              <div className="flex items-center gap-2 py-8 text-muted">
                <Spinner /> Loading articles…
              </div>
            ) : error ? (
              <Notice tone="danger">{error}</Notice>
            ) : articles.length === 0 ? (
              <Notice>No articles yet. Add your first survival guide.</Notice>
            ) : (
              articles.map((a) => (
                <article
                  key={a.id}
                  className={`rounded-card border bg-surface px-4 py-3 transition ${
                    editingId === a.id ? "border-line2" : "border-line"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate text-[14.5px] font-bold text-head">
                        {a.title}
                      </h4>
                      <MonoLabel className="text-faint">
                        {a.category} · {a.source}
                      </MonoLabel>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(a)}
                        className="rounded-chip border border-line2 px-2.5 py-1 text-[12px] text-muted transition hover:text-ink"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(a.id)}
                        className="rounded-chip border border-danger/40 px-2.5 py-1 text-[12px] text-danger transition hover:bg-danger/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-3 text-[13px] leading-snug text-muted">
                    {a.content}
                  </p>
                </article>
              ))
            )}
          </div>

          {/* Editor */}
          <div className="flex flex-col gap-3 rounded-card border border-line bg-surface/50 p-4">
            <div className="flex items-center justify-between">
              <MonoLabel className="text-statusdim">
                {editingId ? "EDIT ARTICLE" : "NEW ARTICLE"}
              </MonoLabel>
              {editingId && (
                <button
                  type="button"
                  onClick={startNew}
                  className="text-[12px] text-muted transition hover:text-ink"
                >
                  + New
                </button>
              )}
            </div>
            <Field
              label="Title"
              value={draft.title}
              onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
              error={errors["title"]}
              placeholder="e.g. The 1918 Influenza Pandemic"
            />
            <Field
              label="Category"
              value={draft.category}
              onChange={(v) => setDraft((d) => ({ ...d, category: v }))}
              error={errors["category"]}
              placeholder="Survival Guide"
            />
            <Field
              label="Source"
              value={draft.source}
              onChange={(v) => setDraft((d) => ({ ...d, source: v }))}
              error={errors["source"]}
              placeholder="SafeHAIVN Field Manual"
            />
            <Field
              label="Content"
              value={draft.content}
              onChange={(v) => setDraft((d) => ({ ...d, content: v }))}
              error={errors["content"]}
              textarea
              placeholder="Key facts, lessons, survival takeaways…"
            />
            {formError && <Notice tone="danger">{formError}</Notice>}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || Object.keys(errors).length > 0}
              className="flex items-center justify-center gap-2 rounded-chip bg-accent px-4 py-2 text-sm font-semibold text-accent-ink shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && (
                <Spinner className="border-accent-ink/40 border-t-accent-ink" />
              )}
              {editingId ? "Update Article" : "Add Article"}
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}

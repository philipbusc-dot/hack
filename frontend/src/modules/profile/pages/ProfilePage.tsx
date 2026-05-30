import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import {
  getProfile,
  updateProfile,
  uploadPhoto,
  addStat,
  updateStat,
  deleteStat,
} from "../apis/profile.api";
import type { ProfileStat } from "../types/profile.types";
import { validateAbout, validateName, validateStat } from "../schemas/profile.schema";

type Region = { casesPerOneMillion: number } | null;

function riskOf(cpm?: number) {
  if (cpm == null) return { label: "No data", cls: "bg-gray-500" };
  if (cpm > 150_000) return { label: "High risk", cls: "bg-red-500" };
  if (cpm > 40_000) return { label: "Moderate", cls: "bg-yellow-400 text-black" };
  return { label: "Low risk", cls: "bg-green-500" };
}

/** Pull a human-readable message out of an axios-style error. */
function errMessage(e: unknown, fallback: string): string {
  const msg = (e as { response?: { data?: { message?: string } } })?.response
    ?.data?.message;
  return typeof msg === "string" ? msg : fallback;
}

export default function ProfilePage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");

  // Editable profile fields. `saved*` is the last value persisted to the
  // backend, used to skip no-op saves and to revert after a failed save.
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [about, setAbout] = useState("");
  const [savedAbout, setSavedAbout] = useState("");
  const [stats, setStats] = useState<ProfileStat[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Regional risk — pulled live for one country (unchanged).
  const [region, setRegion] = useState<Region>(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setName(p.username);
        setSavedName(p.username);
        setAbout(p.description ?? "");
        setSavedAbout(p.description ?? "");
        setStats(p.stats);
        setPhotoUrl(p.photoUrl);
      })
      .catch(() => setLoadError("Could not load your profile. Is the API running?"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("https://disease.sh/v3/covid-19/countries/Thailand")
      .then((r) => r.json())
      .then(setRegion)
      .catch(() => {});
  }, []);
  const risk = riskOf(region?.casesPerOneMillion);

  // ─── Name (username) ───
  async function saveName() {
    const trimmed = name.trim();
    if (trimmed === savedName) return;
    const invalid = validateName(trimmed);
    if (invalid) {
      setSaveError(invalid);
      setName(savedName);
      return;
    }
    try {
      const updated = await updateProfile({ username: trimmed });
      setSavedName(updated.username);
      setName(updated.username);
      setSaveError("");
      await refresh(); // keep the navbar's username in sync
    } catch (e) {
      setSaveError(errMessage(e, "Could not update your name."));
      setName(savedName);
    }
  }

  // ─── Profile photo ───
  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setUploading(true);
    try {
      const updated = await uploadPhoto(file);
      setPhotoUrl(updated.photoUrl);
      setSaveError("");
    } catch (err) {
      setSaveError(errMessage(err, "Could not upload that image."));
    } finally {
      setUploading(false);
    }
  }

  // ─── About (description) ───
  async function saveAbout() {
    const trimmed = about.trim();
    if (trimmed === savedAbout) return;
    const invalid = validateAbout(trimmed);
    if (invalid) {
      setSaveError(invalid);
      setAbout(savedAbout);
      return;
    }
    try {
      const updated = await updateProfile({ description: trimmed });
      setSavedAbout(updated.description ?? "");
      setAbout(updated.description ?? "");
      setSaveError("");
    } catch (e) {
      setSaveError(errMessage(e, "Could not update your about text."));
      setAbout(savedAbout);
    }
  }

  // ─── Statistics ───
  const patchLocalStat = (id: string, patch: Partial<ProfileStat>) =>
    setStats((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  async function saveStat(stat: ProfileStat) {
    const invalid = validateStat(stat.name, stat.value, stat.unit);
    if (invalid) {
      setSaveError(invalid);
      return;
    }
    try {
      const updated = await updateStat(stat.id, {
        name: stat.name.trim(),
        value: stat.value,
        unit: stat.unit.trim(),
      });
      patchLocalStat(stat.id, updated);
      setSaveError("");
    } catch (e) {
      setSaveError(errMessage(e, "Could not save that statistic."));
    }
  }

  async function handleAddStat() {
    try {
      const created = await addStat({ name: "New resource", value: 0, unit: "days" });
      setStats((prev) => [...prev, created]);
      setSaveError("");
    } catch (e) {
      setSaveError(errMessage(e, "Could not add a statistic."));
    }
  }

  async function handleDeleteStat(id: string) {
    try {
      await deleteStat(id);
      setStats((prev) => prev.filter((s) => s.id !== id));
      setSaveError("");
    } catch (e) {
      setSaveError(errMessage(e, "Could not remove that statistic."));
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-[#0A1613] text-gray-400">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-auto bg-[#0A1613] text-white">
      <div className="max-w-md mx-auto p-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#A4D233] transition-colors mb-4"
          aria-label="Go back"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {loadError && <p className="text-red-400 mb-4">{loadError}</p>}

        {/* avatar + name */}
        <div className="text-center">
          <label
            className="group relative w-28 h-28 mx-auto rounded-full bg-[#1D3A33] border-2 border-[#A4D233] grid place-items-center text-5xl overflow-hidden cursor-pointer"
            style={{ boxShadow: "0 0 18px rgba(164,210,51,.4)" }}
            title="Change profile picture"
          >
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>🧑</span>
            )}
            <span className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/55 text-[11px] font-semibold uppercase tracking-wide">
              {uploading ? "Uploading…" : "Change"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhoto}
              disabled={uploading}
            />
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            className="block w-full text-center text-2xl font-bold bg-transparent mt-3 outline-none"
          />
          <p className="text-xs text-gray-400">tap the name to edit · tap the photo to change it</p>
        </div>

        {saveError && <p className="text-red-400 text-sm mt-4">{saveError}</p>}

        {/* about */}
        <div className="mt-7">
          <div className="text-xs font-bold tracking-wide text-[#A4D233]">ABOUT ME</div>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            onBlur={saveAbout}
            rows={3}
            className="w-full mt-2 p-3 rounded-xl bg-[#13241E] border border-[#1D3A33] text-sm text-gray-200 resize-y outline-none"
          />
        </div>

        {/* regional risk */}
        <div className="mt-7">
          <div className="text-xs font-bold tracking-wide text-[#A4D233]">
            REGIONAL RISK SCORE
          </div>
          <div className="mt-2 p-4 rounded-xl bg-[#13241E] border border-[#1D3A33] flex items-center justify-between">
            <div>
              <div className="font-semibold">Thailand</div>
              <div className="text-xs text-gray-400">your area</div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${risk.cls}`}>
                {risk.label}
              </span>
              <div className="text-xs text-gray-400 mt-1">
                {region ? `${region.casesPerOneMillion.toLocaleString()} / 1M` : "…"}
              </div>
            </div>
          </div>
        </div>

        {/* editable statistics */}
        <div className="mt-7 pb-8">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold tracking-wide text-[#A4D233]">
              MY STATISTICS
            </div>
            <button
              onClick={handleAddStat}
              className="flex items-center gap-1 text-xs text-[#A4D233] hover:underline"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            edit a field — it saves automatically
          </p>
          <div className="mt-3">
            {stats.length === 0 ? (
              <p className="text-xs text-gray-400 py-3">
                No statistics yet — add food, water, medicine, etc.
              </p>
            ) : (
              stats.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 py-3 border-b border-[#1D3A33]"
                >
                  <input
                    value={s.name}
                    onChange={(e) => patchLocalStat(s.id, { name: e.target.value })}
                    onBlur={() => saveStat(s)}
                    className="flex-1 px-2 py-1.5 rounded-lg bg-[#13241E] border border-[#2E4A40] text-sm outline-none"
                    aria-label="Statistic name"
                  />
                  <input
                    type="number"
                    min={0}
                    value={s.value}
                    onChange={(e) =>
                      patchLocalStat(s.id, { value: Number(e.target.value) })
                    }
                    onBlur={() => saveStat(s)}
                    className="w-16 text-center px-2 py-1.5 rounded-lg bg-[#13241E] border border-[#2E4A40] text-sm outline-none"
                    aria-label="Value"
                  />
                  <input
                    value={s.unit}
                    onChange={(e) => patchLocalStat(s.id, { unit: e.target.value })}
                    onBlur={() => saveStat(s)}
                    className="w-16 text-center px-2 py-1.5 rounded-lg bg-[#13241E] border border-[#2E4A40] text-sm outline-none"
                    aria-label="Unit"
                  />
                  <button
                    onClick={() => handleDeleteStat(s.id)}
                    className="text-gray-500 hover:text-red-400 shrink-0"
                    aria-label={`Delete ${s.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

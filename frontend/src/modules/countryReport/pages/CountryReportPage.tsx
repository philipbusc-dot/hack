import { useEffect, useState } from "react";
import {
  getReports,
  createReport,
  updateReport,
  deleteReport,
} from "../apis/countryReport.api";
import type { CountryReport } from "../types/countryReport.types";

const EMPTY = {
  countryCode: "",
  countryName: "",
  severity: "Moderate",
  cases: 0,
  note: "",
};

const severityColor: Record<string, string> = {
  High: "bg-red-500",
  Moderate: "bg-yellow-400 text-black",
  Low: "bg-green-500",
};

export default function CountryReportPage() {
  const [reports, setReports] = useState<CountryReport[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // READ — load all reports
  async function load() {
    try {
      setReports(await getReports());
    } catch {
      setError("Could not load reports (is the backend running?)");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  // CREATE or UPDATE
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, cases: Number(form.cases) };
      if (editingId === null) {
        await createReport(payload);
      } else {
        await updateReport(editingId, payload);
      }
      setForm({ ...EMPTY });
      setEditingId(null);
      load();
    } catch {
      setError("Save failed — check the fields and try again.");
    }
  }

  // start editing a row
  function startEdit(r: CountryReport) {
    setEditingId(r.id);
    setForm({
      countryCode: r.countryCode,
      countryName: r.countryName,
      severity: r.severity,
      cases: r.cases,
      note: r.note,
    });
  }

  // DELETE
  async function handleDelete(id: number) {
    if (!confirm("Delete this report?")) return;
    await deleteReport(id);
    load();
  }

  return (
    <div className="min-h-screen w-full bg-[#0A1613] text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-1 text-[#A4D233]">Country Reports</h1>
        <p className="text-sm text-gray-400 mb-6">
          Create, edit, and delete outbreak reports (full CRUD).
        </p>

        {/* CREATE / EDIT form */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#13241E] border border-[#1D3A33] rounded-xl p-5 mb-8 grid grid-cols-2 gap-3"
        >
          <input
            className="bg-[#0A1613] border border-[#2E4A40] rounded px-3 py-2"
            placeholder="Country code (e.g. IT)"
            value={form.countryCode}
            onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
            required
          />
          <input
            className="bg-[#0A1613] border border-[#2E4A40] rounded px-3 py-2"
            placeholder="Country name (e.g. Italy)"
            value={form.countryName}
            onChange={(e) => setForm({ ...form, countryName: e.target.value })}
            required
          />
          <select
            className="bg-[#0A1613] border border-[#2E4A40] rounded px-3 py-2"
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
          >
            <option>High</option>
            <option>Moderate</option>
            <option>Low</option>
          </select>
          <input
            type="number"
            className="bg-[#0A1613] border border-[#2E4A40] rounded px-3 py-2"
            placeholder="Cases"
            value={form.cases}
            onChange={(e) => setForm({ ...form, cases: Number(e.target.value) })}
          />
          <input
            className="bg-[#0A1613] border border-[#2E4A40] rounded px-3 py-2 col-span-2"
            placeholder="Note (optional)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <div className="col-span-2 flex gap-3">
            <button
              type="submit"
              className="bg-[#A4D233] text-black font-semibold rounded px-4 py-2"
            >
              {editingId === null ? "Add report" : "Save changes"}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ ...EMPTY });
                }}
                className="border border-[#2E4A40] rounded px-4 py-2 text-gray-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        {/* LIST */}
        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-400">No reports yet — add one above.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.id}
                className="bg-[#13241E] border border-[#1D3A33] rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{r.countryName}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        severityColor[r.severity] ?? "bg-gray-500"
                      }`}
                    >
                      {r.severity}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {r.cases.toLocaleString()} cases
                    {r.note ? ` · ${r.note}` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(r)}
                    className="text-sm border border-[#2E4A40] rounded px-3 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-sm border border-red-500 text-red-400 rounded px-3 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";

// small helper: state that auto-saves to localStorage
function usePersist<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved !== null ? (JSON.parse(saved) as T) : initial;
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}

type Supply = { label: string; value: string };
type Region = { casesPerOneMillion: number } | null;

function riskOf(cpm?: number) {
  if (cpm == null) return { label: "No data", cls: "bg-gray-500" };
  if (cpm > 150_000) return { label: "High risk", cls: "bg-red-500" };
  if (cpm > 40_000) return { label: "Moderate", cls: "bg-yellow-400 text-black" };
  return { label: "Low risk", cls: "bg-green-500" };
}

export default function ProfilePage() {
  const [name, setName] = usePersist("profile.name", "Your Name");
  const [about, setAbout] = usePersist(
    "profile.about",
    "Prepared and keeping an eye on my region's risk. Supplies stocked, ready for my area."
  );
  const [supplies, setSupplies] = usePersist<Supply[]>("profile.supplies", [
    { label: "Food stock", value: "7 days" },
    { label: "Water stock", value: "5 days" },
    { label: "Medkit stock", value: "2 kits" },
  ]);

  // regional risk — pulled live for one country
  const [region, setRegion] = useState<Region>(null);
  useEffect(() => {
    fetch("https://disease.sh/v3/covid-19/countries/Thailand")
      .then((r) => r.json())
      .then(setRegion)
      .catch(() => {});
  }, []);
  const risk = riskOf(region?.casesPerOneMillion);

  const setSupply = (i: number, val: string) =>
    setSupplies(supplies.map((s, idx) => (idx === i ? { ...s, value: val } : s)));

  return (
    <div className="fixed inset-0 overflow-auto bg-[#0A1613] text-white">
      <div className="max-w-md mx-auto p-8">
        {/* avatar + name */}
        <div className="text-center">
          <div
            className="w-28 h-28 mx-auto rounded-full bg-[#1D3A33] border-2 border-[#A4D233] grid place-items-center text-5xl"
            style={{ boxShadow: "0 0 18px rgba(164,210,51,.4)" }}
          >
            🧑
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full text-center text-2xl font-bold bg-transparent mt-3 outline-none"
          />
          <p className="text-xs text-gray-400">tap the name to edit</p>
        </div>

        {/* about */}
        <div className="mt-7">
          <div className="text-xs font-bold tracking-wide text-[#A4D233]">ABOUT ME</div>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
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

        {/* editable supplies */}
        <div className="mt-7 pb-8">
          <div className="text-xs font-bold tracking-wide text-[#A4D233]">MY STATISTICS</div>
          <p className="text-xs text-gray-400 mt-0.5">edit a value — it saves automatically</p>
          <div className="mt-3">
            {supplies.map((s, i) => (
              <div
                key={s.label}
                className="flex items-center justify-between py-3 border-b border-[#1D3A33]"
              >
                <span>{s.label}</span>
                <input
                  value={s.value}
                  onChange={(e) => setSupply(i, e.target.value)}
                  className="w-28 text-center px-3 py-1.5 rounded-lg bg-[#13241E] border border-[#2E4A40] text-sm outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

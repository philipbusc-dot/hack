import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Globe from "react-globe.gl";
import { fetchCountries, fetchGeo } from "../apis/map.api";
import { getReports } from "../../countryReport/apis/countryReport.api";
import type { CountryReport } from "../../countryReport/types/countryReport.types";
import type { Stat } from "../types/map.types";

const SEV_COLOR: Record<string, string> = {
  High: "#ff3b3b",
  Moderate: "#ffd23b",
  Low: "#21e065",
};
const RED = 150_000;
const YELLOW = 40_000;

function bucketColor(cpm?: number) {
  if (cpm == null) return "#3a3f55";
  if (cpm > RED) return SEV_COLOR.High;
  if (cpm > YELLOW) return SEV_COLOR.Moderate;
  return SEV_COLOR.Low;
}
function bucketLabel(cpm?: number) {
  if (cpm == null) return "No data";
  if (cpm > RED) return "High risk";
  if (cpm > YELLOW) return "Moderate";
  return "Low risk";
}

export default function MapPage() {
  const [features, setFeatures] = useState<any[]>([]);
  const [byIso, setByIso] = useState<Record<string, Stat>>({});
  const [byName, setByName] = useState<Record<string, Stat>>({});
  const [reportSeverity, setReportSeverity] = useState<Record<string, string>>({});
  const [reports, setReports] = useState<CountryReport[]>([]);
  const [hover, setHover] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);

  // country shapes
  useEffect(() => {
    fetchGeo().then((d) =>
      setFeatures(d.features.filter((f: any) => f.properties.ISO_A2 !== "AQ"))
    );
  }, []);

  // live world data
  useEffect(() => {
    fetchCountries().then((rows) => {
      const iso: Record<string, Stat> = {};
      const name: Record<string, Stat> = {};
      for (const c of rows) {
        if (c.countryInfo?.iso2) iso[c.countryInfo.iso2] = c;
        name[c.country.toLowerCase()] = c;
      }
      setByIso(iso);
      setByName(name);
    });
  }, []);

  // YOUR reports (CRUD) — these override the map color so the map shows your data
  useEffect(() => {
    getReports()
      .then((rs) => {
        setReports(rs);
        const m: Record<string, string> = {};
        // rs is newest-first; the first per code wins as the headline severity.
        for (const r of rs) if (!(r.countryCode in m)) m[r.countryCode] = r.severity;
        setReportSeverity(m);
      })
      .catch(() => {});
  }, []);

  const statOf = (f: any): Stat | undefined =>
    byIso[f.properties.ISO_A2] ??
    byName[(f.properties.ADMIN ?? f.properties.NAME ?? "").toLowerCase()];

  const colorOf = (f: any) => {
    const rep = reportSeverity[f.properties.ISO_A2];
    if (rep) return SEV_COLOR[rep] ?? "#3a3f55"; // your report wins
    return bucketColor(statOf(f)?.casesPerOneMillion);
  };

  const reportsOf = (f: any): CountryReport[] => {
    const code = (f.properties.ISO_A2 ?? "").toUpperCase();
    return reports.filter((r) => r.countryCode.toUpperCase() === code);
  };

  return (
    <div className="fixed inset-0 bg-[#0A1613] text-white">
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundColor="#0A1613"
        showAtmosphere
        atmosphereColor="#A4D233"
        atmosphereAltitude={0.2}
        polygonsData={features}
        polygonAltitude={(f: any) => (f === hover || f === selected ? 0.07 : 0.012)}
        polygonCapColor={(f: any) => colorOf(f)}
        polygonSideColor={() => "rgba(0,0,0,0.5)"}
        polygonStrokeColor={() => "#0a0f1f"}
        onPolygonHover={(f: any) => setHover(f)}
        onPolygonClick={(f: any) => setSelected(f)}
        polygonsTransitionDuration={300}
      />

      <div className="absolute top-20 left-5">
        <h1
          className="text-xl font-bold"
          style={{ textShadow: "0 0 14px rgba(164,210,51,.5)" }}
        >
          🦠 GLOBAL INFECTION RISK
        </h1>
        <div className="mt-2 text-sm flex gap-3 items-center">
          <Legend color="#ff3b3b" label="High" />
          <Legend color="#ffd23b" label="Moderate" />
          <Legend color="#21e065" label="Low" />
          <span className="text-gray-400">click a country →</span>
        </div>
      </div>

      {selected && (
        <Panel
          feature={selected}
          stat={statOf(selected)}
          reportSeverity={reportSeverity[selected.properties.ISO_A2]}
          reports={reportsOf(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="w-3 h-3 rounded-sm inline-block"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      {label}
    </span>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{k}</span>
      <b>{v.toLocaleString()}</b>
    </div>
  );
}

function Panel({
  feature,
  stat,
  reportSeverity,
  reports,
  onClose,
}: {
  feature: any;
  stat?: Stat;
  reportSeverity?: string;
  reports: CountryReport[];
  onClose: () => void;
}) {
  const code = feature.properties.ISO_A2;
  const countryName = feature.properties.ADMIN;
  const badgeColor = reportSeverity
    ? SEV_COLOR[reportSeverity] ?? "#888"
    : bucketColor(stat?.casesPerOneMillion);
  const label = reportSeverity
    ? `${reportSeverity} (your report)`
    : bucketLabel(stat?.casesPerOneMillion);
  // reports arrive newest-first; show only the latest few here.
  const latest = reports.slice(0, 3);
  return (
    <div className="absolute top-24 right-6 z-10 w-72 p-5 rounded-2xl bg-[#13241E]/90 border border-[#A4D233]/40 backdrop-blur">
      <button onClick={onClose} className="float-right text-gray-400">
        ✕
      </button>
      <h2 className="text-lg font-bold mb-2">{countryName}</h2>
      <span
        className="inline-block px-3 py-0.5 rounded-full text-xs font-bold text-black mb-3"
        style={{ background: badgeColor }}
      >
        {label}
      </span>
      {stat ? (
        <div className="text-sm space-y-1">
          <Row k="Total cases" v={stat.cases} />
          <Row k="Active" v={stat.active} />
          <Row k="Deaths" v={stat.deaths} />
          <Row k="Recovered" v={stat.recovered} />
          <Row k="Cases / 1M" v={stat.casesPerOneMillion} />
          <Row k="Population" v={stat.population} />
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No data for this country.</p>
      )}

      <div className="mt-4 border-t border-[#1D3A33] pt-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold">Latest reports</h3>
          <Link
            to={`/reports/${code}`}
            state={{ countryName }}
            className="text-xs text-[#A4D233] hover:underline"
          >
            See all{reports.length ? ` (${reports.length})` : ""}
          </Link>
        </div>
        {latest.length === 0 ? (
          <p className="text-gray-400 text-xs">No reports yet.</p>
        ) : (
          <ul className="space-y-2">
            {latest.map((r) => (
              <li key={r.id} className="text-xs">
                {r.topic && (
                  <p className="text-white font-semibold mb-0.5">{r.topic}</p>
                )}
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-black"
                    style={{ background: SEV_COLOR[r.severity] ?? "#888" }}
                  >
                    {r.severity}
                  </span>
                  <span className="text-gray-300">
                    {r.cases.toLocaleString()} cases
                  </span>
                </div>
                {r.note && <p className="text-gray-400 mt-0.5">{r.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

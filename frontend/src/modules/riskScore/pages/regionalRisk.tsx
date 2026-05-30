import { useEffect, useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { calculateRegionRisk } from "../apis/risk.api";
import { DANGER_STYLE, REGIONS } from "../data/regions";
import type { RegionRiskPreview } from "../types/risk.types";
import { useNavigate } from "react-router-dom";
import RiskCard from "../components/riskCard";
import 'katex/dist/katex.min.css';
import Latex from '../Latex'; 

ChartJS.register(ArcElement, Tooltip, Legend);

const FACTOR_META: {
    key: keyof RegionRiskPreview["factors"];
    label: string;
    unit: string;
}[] = [
        { key: "infectionRate", label: "Infection Rate", unit: "" },
        { key: "airportTraffic", label: "Airport Traffic", unit: "" },
        { key: "humidity", label: "Humidity", unit: "%" },
        { key: "populationDensity", label: "Population Density", unit: "/km²" },
        { key: "hospitalPressure", label: "Hospital Pressure", unit: "%" },
    ];

export default function RegionalRisk() {
    const [regionIndex, setRegionIndex] = useState(0);
    const [data, setData] = useState<RegionRiskPreview | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const [nearby, setNearby] = useState<{ label: string; score: number }[]>([]);

    const region = REGIONS[regionIndex]!;

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        calculateRegionRisk({
            country: region.country,
            lat: region.lat,
            lng: region.lng,
        })
            .then((res) => {
                if (!cancelled) setData(res);
            })
            .catch(() => {
                if (!cancelled)
                    setError("Could not load risk data. Is the API running?");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [region.country, region.lat, region.lng]);

    useEffect(() => {
        let cancelled = false;

        Promise.all(
            REGIONS.map(async (r) => ({
                label: r.label,
                score: (
                    await calculateRegionRisk({
                        country: r.country,
                        lat: r.lat,
                        lng: r.lng,
                    })
                ).regionalScore,
            }))
        )
            .then((results) => {
                if (!cancelled) setNearby(results);
            })

        return () => {
            cancelled = true;
        };
    }, []);

    const style = data ? DANGER_STYLE[data.dangerLevel] : DANGER_STYLE.LOW;
    const saferRegions = nearby
        .filter((n) => n.label !== region.label && n.score < (data?.regionalScore ?? 0))
        .sort((a, b) => b.score - a.score);
    const chartData = useMemo(() => {
        const score = data?.regionalScore ?? 0;
        return {
            labels: ["Risk", "Safe"],
            datasets: [
                {
                    data: [score, 100 - score],
                    backgroundColor: [style.hex, "#e5e7eb"],
                    borderWidth: 0,
                },
            ],
        };
    }, [data?.regionalScore, style.hex]);

    return (
        <div className="flex flex-col gap-3 w-full max-w-3xl p-6">
            <div className="flex flex-row gap-3 items-center">
                <div>
                    <TriangleAlert color="white" size={35} />
                </div>
                <h1 className="text-3xl text-white font-bold">Regional Danger Score</h1>
            </div>
            <div className="text-xs text-muted font-bold">
                An assessment of your regional risk to exposure
            </div>

            <div className="flex flex-row w-full gap-3">
                <button className="flex w-full justify-center p-1 bg-accent rounded-full italic font-bold text-xs items-center">
                    Regional Score
                </button>
                <button onClick={() => navigate("/risk/yourscore")} className="flex w-full justify-center p-1 border border-line text-faint rounded-full italic text-xs items-center cursor-pointer">
                    Your Score
                </button>
            </div>

            {error && <div className="text-red-600 text-sm my-2">{error}</div>}

            <div className="flex flex-col md:flex-row gap-5 items-center justify-center">
                <div className="flex flex-col flex-1 w-full">
                    <div className="my-3 w-full">
                        <select
                            className="border w-full bg-drop rounded-full text-xs px-3 py-1"
                            value={regionIndex}
                            onChange={(e) => setRegionIndex(Number(e.target.value))}
                        >
                            {REGIONS.map((r, i) => (
                                <option key={r.label} value={i}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex bg-surface border-2 border-line w-full h-full justify-center items-center p-20 rounded-2xl">
                        <div className="flex flex-col gap-10 justify-center items-center">
                            <div className="relative w-48 h-48">
                                <Doughnut
                                    data={chartData}
                                    options={{
                                        cutout: "72%",
                                        plugins: { legend: { display: false } },
                                    }}
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className={`text-4xl font-bold ${style.text}`}>
                                        {loading ? "…" : data?.regionalScore ?? "—"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div className="w-full text-white text-sm space-y-1">
                                    {FACTOR_META.map(({ key, label, unit }) => (
                                        <div
                                            key={key}
                                            className="flex justify-between border-b border-line py-1"
                                        >
                                            <span className="text-muted">{label}</span>
                                            <span className="font-semibold">
                                                {data ? `${data.factors[key]}${unit}` : "—"}
                                                {data && (
                                                    <span className="ml-1 text-[10px] uppercase text-muted">
                                                        {data.sources[key]}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {data?.meta.nearestAirport && (
                                    <div className="text-[11px] text-muted mt-2">
                                        Nearest hub: {data.meta.nearestAirport}
                                        {typeof data.meta.nearestAirportKm === "number" &&
                                            ` (${data.meta.nearestAirportKm} km)`}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col text-white text-[7.5px] justify-center items-center space-y-1 mt-2">
                        <p className="text-muted font-bold">How the regional score is calculated</p>
                        <Latex>{String.raw`$$S(H) = \frac{1.5}{1 + e^{-0.05\,(H - 100)}}$$`}</Latex>
                        <Latex>{String.raw`$$R_{\text{total}} = \min\!\left(100,\ I\cdot\ln(P)\cdot(1+0.01A)\cdot S(H) + 0.1(\,\text{Humidity})\right)$$`}</Latex>
                    </div>
                </div>
                <div className="flex flex-col flex-1 w-full">
                    <h1 className="text-white font-bold w-full m-2 text-xl italic">Nearby Regions</h1>
                    <div className="flex flex-row justify-between text-white m-2 font-bold">
                        <h1>Region Name</h1>
                        <h1>Score</h1>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                        {saferRegions.length === 0 ? (
                            <p className="text-muted text-xs">
                                No nearby regions are safer than {region.label}.
                            </p>
                        ) : (
                            saferRegions.map((n) => (
                                <RiskCard key={n.label} region={n.label} score={n.score} />
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}

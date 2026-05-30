import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, UserRound } from "lucide-react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import { calculateRegionRisk } from "../apis/risk.api";
import {
    addStat,
    calculatePersonal,
    deleteStat,
    updateStat,
} from "../apis/personal.api";
import { DANGER_STYLE, REGIONS } from "../data/regions";
import type { PersonalRiskResult, SurvivalStat } from "../types/personal.types";
import FactorCard from "../components/factorCard";
import InputModal from "../components/inputModal";
import "katex/dist/katex.min.css";
import Latex from '../Latex';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function YourRisk() {
    const [regionIndex] = useState(0);
    const [regionalScore, setRegionalScore] = useState<number | null>(null);
    const [personal, setPersonal] = useState<PersonalRiskResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<SurvivalStat | null>(null);
    const [saving, setSaving] = useState(false);
    const region = REGIONS[regionIndex]!;
    const refreshPersonal = useCallback(async (score: number) => {
        const result = await calculatePersonal(score);
        setPersonal(result);
    }, []);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        calculateRegionRisk({
            country: region.country,
            lat: region.lat,
            lng: region.lng,
        })
            .then(async (res) => {
                if (cancelled) return;
                setRegionalScore(res.regionalScore);
                await refreshPersonal(res.regionalScore);
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
    }, [region.country, region.lat, region.lng, refreshPersonal]);

    const closeModal = () => {
        setShowModal(false);
        setEditing(null);
    };

    const openAdd = () => {
        setEditing(null);
        setShowModal(true);
    };

    const handleEdit = (s: SurvivalStat) => {
        setEditing(s);
        setShowModal(true);
    };

    const handleSubmit = async (name: string, value: number) => {
        setSaving(true);
        try {
            if (editing) {
                await updateStat(editing.id, { name, value });
            } else {
                await addStat({ name, value });
            }
            if (regionalScore !== null) await refreshPersonal(regionalScore);
            closeModal();
        } catch {
            setError(
                editing ? "Could not update the stat." : "Could not add the stat."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteStat(id);
            if (regionalScore !== null) await refreshPersonal(regionalScore);
        } catch {
            setError("Could not remove the stat.");
        }
    };

    const style = personal ? DANGER_STYLE[personal.dangerLevel] : DANGER_STYLE.LOW;
    const stats = personal?.stats ?? [];
    const chartData = useMemo(() => {
        const psi = personal?.psi ?? 0;
        return {
            labels: ["Risk", "Safe"],
            datasets: [
                {
                    data: [psi, 100 - psi],
                    backgroundColor: [style.hex, "#e5e7eb"],
                    borderWidth: 0,
                },
            ],
        };
    }, [personal?.psi, style.hex]);

    return (
        <div className="flex flex-col gap-3 w-full max-w-3xl p-6">
            <div className="flex flex-row gap-3 items-center">
                <div>
                    <UserRound color="white" size={35} />
                </div>
                <h1 className="text-3xl text-white font-bold">Your Danger Score</h1>
            </div>
            <div className="text-xs text-muted font-bold">
                Your regional risk, adapted to your personal preparation
            </div>

            <div className="flex flex-row w-full gap-3">
                <button
                    onClick={() => navigate("/risk/region")}
                    className="flex w-full justify-center p-1 border border-line text-faint rounded-full italic text-xs items-center cursor-pointer"
                >
                    Regional Score
                </button>
                <button className="flex w-full justify-center p-1 bg-accent rounded-full italic font-bold text-xs items-center">
                    Your Score
                </button>
            </div>

            {error && <div className="text-danger text-sm my-2">{error}</div>}

            <div className="flex flex-col md:flex-row gap-5 items-center justify-center">
                <div className="flex flex-col flex-1 w-full">
                    <div className="my-3 w-full">
                        <h1 className="bg-drop rounded-full text-xs px-3 py-1">Ronald Kok</h1>
                    </div>

                    <div className="flex flex-col gap-6 bg-surface border-2 border-line w-full h-full justify-center items-center p-10 rounded-2xl">
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
                                    {loading ? "…" : personal?.psi ?? "—"}
                                </span>
                            </div>
                        </div>

                        <div className="w-full text-white text-sm space-y-1">
                            <div className="flex justify-between border-b border-line py-1">
                                <span className="text-muted">Regional score</span>
                                <span className="font-semibold">
                                    {regionalScore ?? "—"}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-line py-1">
                                <span className="text-muted">Weakest link</span>
                                <span className="font-semibold">
                                    {personal?.limitingStat
                                        ? `${personal.limitingStat} · ${personal.limitingDays}d`
                                        : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-line py-1">
                                <span className="text-muted">Resource mitigation</span>
                                <span className="font-semibold text-lime">
                                    {personal ? `-${personal.resourceMitigation}` : "—"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center items-center text-white text-[7.5px] space-y-1 mt-2">
                        <p className="text-muted font-bold">How your PSI is calculated</p>
                        {/* Limiting Factor Model: the resource that runs dry first
                            (d_min) is converted to mitigation M via a diminishing-
                            returns curve, then subtracted from the regional score. */}
                        <Latex>{String.raw`$$PSI = \max\left(0,\ R_{\text{total}} - M\right)$$`}</Latex>
                        <Latex>{String.raw`$$M = 40\left(1 - e^{-0.15\, d_{\min}}\right)$$`}</Latex>
                        <Latex>{String.raw`$$d_{\min} = \min_i(\text{days}_i)$$`}</Latex>
                    </div>
                </div>
                <div className="flex flex-col flex-1 w-full">
                    <div className="flex flex-row justify-between items-center">
                        <h1 className="text-white font-bold m-2 text-xl italic">
                            Your Statistics
                        </h1>
                        <button
                            onClick={openAdd}
                            className="cursor-pointer"
                            aria-label="Add statistic"
                        >
                            <Plus color="white" />
                        </button>
                    </div>

                    <div className="flex flex-row justify-between text-white m-2 font-bold text-sm">
                        <h1>Factor</h1>
                        <h1>Score</h1>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                        {stats.length === 0 ? (
                            <p className="text-muted text-xs m-2">
                                No resources yet. Add food, water, medicine to lower your
                                personal risk.
                            </p>
                        ) : (
                            stats.map((s) => {
                                const isWeakest =
                                    personal?.limitingStat === s.name &&
                                    personal?.limitingDays === s.value;
                                return (
                                    <FactorCard
                                        key={s.id}
                                        factor={s.name}
                                        score={s.value}
                                        isWeakestLink={isWeakest}
                                        accentColor={style.hex}
                                        onEdit={() => handleEdit(s)}
                                        onDelete={() => handleDelete(s.id)}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <InputModal
                isOpen={showModal}
                title={editing ? "Edit a Statistic" : "Add a Statistic"}
                submitLabel={editing ? "Save" : "Submit"}
                initialName={editing?.name ?? ""}
                initialValue={editing?.value ?? null}
                saving={saving}
                onClose={closeModal}
                onSubmit={handleSubmit}
            />
        </div>
    );
}

import { useEffect, useState } from "react";
import type { SurvivorProfile } from "../../types/connect.types";
import { getSurvivorOpinion } from "../../apis/Connect.api";

interface MatchProfileProps {
    survivor: SurvivorProfile;
}

const MatchProfile = ({ survivor }: MatchProfileProps) => {
    const [prevId, setPrevId] = useState(survivor.id);
    const [imgFailed, setImgFailed] = useState(false);
    // AI opinion is fetched lazily when this survivor is shown (generated +
    // cached server-side on first view).
    const [opinion, setOpinion] = useState<string | null>(null);

    if (survivor.id !== prevId) {
        setPrevId(survivor.id);
        setImgFailed(false);
    }

    useEffect(() => {
        let cancelled = false;
        setOpinion(null);
        getSurvivorOpinion(survivor.id)
            .then((text) => {
                if (!cancelled) setOpinion(text);
            })
            .catch(() => {
                if (!cancelled) setOpinion("Unable to reach the analysis terminal.");
            });
        return () => {
            cancelled = true;
        };
    }, [survivor.id]);
    // Personal risk factor comes from the RiskFactor module (computed server-side
    // from this survivor's statistics). Fall back to a supply-derived estimate for
    // any legacy profile that hasn't been enriched yet.
    const getRiskScore = (): number => {
        if (typeof survivor.personalRiskScore === "number")
            return survivor.personalRiskScore;
        if (survivor.regionalRiskScore !== undefined)
            return Number(survivor.regionalRiskScore) || 0;
        const totalSupplies = (survivor.supplies || []).reduce(
            (acc, curr) => acc + curr.value,
            0
        );
        return Math.max(15, Math.min(95, 100 - totalSupplies));
    };

    const riskVal = getRiskScore();
    const dangerLevel =
        survivor.personalDangerLevel ??
        (riskVal >= 66 ? "HIGH" : riskVal >= 33 ? "MODERATE" : "LOW");
    const riskScoreLabel = `${riskVal}/100 (${dangerLevel})`;

    // Statistics (name/value/unit) from the RiskFactor module; fall back to the
    // legacy supplies shape if statistics aren't present.
    const statistics =
        survivor.statistics ??
        (survivor.supplies ?? []).map((s) => ({
            name: s.label,
            value: s.value,
            unit: s.unit,
        }));

    return (
        <div className="w-full max-w-[834px] px-4 pt-10 pb-20 flex flex-col justify-start items-center gap-4 mx-auto overflow-y-auto">
            {/* Photo Container */}
            <div className="w-64 h-64 md:w-96 md:h-96 relative shrink-0 border border-neutral-700 bg-neutral-900 overflow-hidden rounded-xl">
                {survivor.avatarUrl && !imgFailed ? (
                    <img
                        className="w-full h-full object-cover"
                        src={survivor.avatarUrl}
                        alt={survivor.name}
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    /* Glow main-frame scan placeholder */
                    <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-950/80 border border-lime-500/20 select-none font-mono relative overflow-hidden group">
                        {/* Scanning scanner sweep animation line */}
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-lime-500/50 shadow-[0_0_10px_#84cc16] animate-scan" />
                        
                        {/* Target scope grid elements */}
                        <div className="absolute inset-4 border border-dashed border-lime-500/10 rounded-full animate-[spin_20s_linear_infinite]" />
                        
                        <div className="text-5xl text-lime-400 drop-shadow-[0_0_8px_#84cc16] font-bold select-none z-10">
                            {survivor.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-[10px] text-lime-500/50 tracking-widest mt-2 uppercase select-none z-10">
                            Telemetry Missing
                        </div>
                    </div>
                )}
            </div>

            {/* Name and Distance */}
            <div className="self-stretch flex flex-col justify-start items-start overflow-hidden">
                <div className="w-full text-indigo-50 text-2xl md:text-3xl font-bold font-['Inter']">
                    {survivor.name}, {survivor.age}
                </div>
                <div className="self-stretch px-2 py-1 rounded-lg flex justify-between items-center mt-1 select-none font-mono">
                    <div className="text-indigo-50 text-xs md:text-sm font-medium">
                        distance
                    </div>
                    <div className="text-neutral-400 text-xs font-normal">
                        {survivor.distance}
                    </div>
                </div>
            </div>

            {/* About Me */}
            <div className="self-stretch px-4 py-4 bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col justify-start items-start gap-2 overflow-hidden">
                <div className="self-stretch text-indigo-50 text-lg md:text-xl font-medium font-['Inter'] uppercase tracking-wider">
                    about me
                </div>
                <div className="self-stretch text-indigo-50 text-sm md:text-base font-normal font-['Inter'] leading-relaxed">
                    {survivor.bio}
                </div>
            </div>

            {/* Information grid */}
            <div className="self-stretch px-4 py-4 bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col justify-start items-start gap-3 overflow-hidden">
                <div className="self-stretch text-indigo-50 text-lg md:text-xl font-medium font-['Inter'] uppercase tracking-wider">
                    risk factor & statistics
                </div>

                <div className="self-stretch grid grid-cols-1 gap-x-8 gap-y-3 font-mono">
                    <div className="flex justify-between items-center py-1.5 border-b border-neutral-800">
                        <div className="text-neutral-400 text-xs">Personal Risk Factor</div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${dangerLevel === "HIGH" ? "bg-red-950/50 text-red-400 border border-red-900/50" :
                            dangerLevel === "MODERATE" ? "bg-amber-950/50 text-amber-400 border border-amber-900/50" :
                                "bg-lime-950/50 text-lime-400 border border-lime-900/50"
                            }`}>
                            {riskScoreLabel}
                        </span>
                    </div>
                    {survivor.limitingStat && (
                        <div className="flex justify-between items-center py-1.5 border-b border-neutral-800">
                            <div className="text-neutral-400 text-xs">Weakest link</div>
                            <div className="text-indigo-50 text-xs font-semibold">{survivor.limitingStat}</div>
                        </div>
                    )}
                    {statistics.map((stat, idx) => (
                        <div key={stat.name} className={`flex justify-between items-center py-1.5 ${idx < statistics.length - 1 ? "border-b border-neutral-800" : ""}`}>
                            <div className="text-neutral-400 text-xs">{stat.name}</div>
                            <div className="text-indigo-50 text-xs font-semibold">{stat.value} {stat.unit}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI's Opinion */}
            <div className="self-stretch px-4 py-4 bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col justify-start items-start gap-2 overflow-hidden">
                <div className="self-stretch text-indigo-50 text-lg md:text-xl font-medium font-['Inter'] uppercase tracking-wider">
                    AI’s opinion
                </div>
                <div className="self-stretch text-indigo-50 text-xs md:text-sm font-normal font-['Inter'] leading-relaxed">
                    {opinion === null ? (
                        <span className="text-neutral-500 italic animate-pulse">
                            Analyzing survivor telemetry…
                        </span>
                    ) : (
                        opinion
                    )}
                </div>
            </div>
        </div>
    );
};

export default MatchProfile;

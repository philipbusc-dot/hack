import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MatchProfile from "../components/MatchMaking/MatchProfile";
import ActionBar from "../components/MatchMaking/ActionBar";
import { useMatchMakingFeed } from "../hooks/useMatchMakingFeed";
import { swipeSurvivor } from "../apis/Connect.api";

const MatchMakingPage = () => {
  const navigate = useNavigate();
  const { survivors, matchesCount, loading } = useMatchMakingFeed();
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentSurvivor = survivors[currentIndex];

  const handleAction = async (type: "no" | "like" | "love") => {
    if (!currentSurvivor) return;
    try {
      await swipeSurvivor(currentSurvivor.id, type);
    } catch (err) {
      console.error("Failed to push connection status to server:", err);
    }
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col w-screen h-screen bg-neutral-950 overflow-hidden items-center justify-center p-6 text-center select-none font-mono">
        <div className="text-4xl mb-4 animate-spin">📡</div>
        <h2 className="text-xl font-bold mb-2 uppercase text-lime-400">Locking Transceiver...</h2>
        <p className="text-xs text-neutral-400 leading-relaxed max-w-xs animate-pulse">
          Establishing encrypted handshake with localized grid relays. Syncing survivor telemetry.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-neutral-950 overflow-hidden select-none relative">
      <div className="flex-1 relative min-h-0 w-full">
        {currentSurvivor ? (
          <>
            <div className="w-full h-full overflow-y-auto pb-32">
              <MatchProfile survivor={currentSurvivor} />
            </div>

            <ActionBar
              onPass={() => handleAction("no")}
              onLike={() => handleAction("like")}
              onLove={() => handleAction("love")}
              matchesCount={matchesCount}
            />
          </>
        ) : (
          /* Out of matches fallback screen */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full font-mono text-neutral-200">
            <div className="text-4xl mb-4">📡</div>
            <h2 className="text-xl font-bold mb-2 uppercase text-lime-400">Radar Inactive</h2>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              No further broadcast signatures detected in current local grid perimeter.
            </p>
            <div className="w-full space-y-3">
              <button
                onClick={() => setCurrentIndex(0)}
                className="w-full py-2.5 border border-lime-400 bg-lime-400/10 text-lime-400 rounded font-medium hover:bg-lime-400/25 transition-all active:scale-95"
              >
                Reset Radar Feed
              </button>
              <button
                onClick={() => navigate("/chat")}
                className="w-full py-2.5 border border-neutral-700 bg-neutral-900 text-neutral-100 rounded font-medium hover:bg-neutral-800 transition-all active:scale-95"
              >
                Open Chats ({matchesCount})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchMakingPage;
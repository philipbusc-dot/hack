import { useNavigate } from "react-router-dom";
import { Settings, X, Heart, Check, MessageSquare } from "lucide-react";

interface ActionBarProps {
  onPass: () => void;
  onLike: () => void;
  onLove: () => void;
  matchesCount: number;
}

/**
 * Floating action bar at the bottom of the MatchMaking feed.
 * Contains Settings, Pass, Love, Like, and Chat navigation buttons.
 */
const ActionBar = ({ onPass, onLike, onLove, matchesCount }: ActionBarProps) => {
  const navigate = useNavigate();

  return (
    <div className="absolute bottom-0 left-0 right-0 w-full flex items-center justify-center gap-3 md:gap-10 py-4 md:py-8 z-30 bg-linear-to-t from-neutral-950 via-neutral-950/90 to-transparent">

      <button
        onClick={() => alert("Broadcasting Radar Firmware Settings...")}
        className="w-12 h-12 md:w-20 md:h-20 bg-lime-300 hover:bg-lime-400 rounded-full flex justify-center items-center shadow-lg active:scale-95 text-neutral-900 shrink-0 transition-all cursor-pointer"
        title="Settings"
      >
        <Settings className="w-5 h-5 md:w-8 md:h-8" strokeWidth={2} />
      </button>

      <button
        onClick={onPass}
        className="w-10 h-10 md:w-16 md:h-16 bg-lime-300 hover:bg-lime-400 rounded-full flex justify-center items-center shadow-lg active:scale-95 text-neutral-900 shrink-0 transition-all cursor-pointer"
        title="Pass"
      >
        <X className="w-4 h-4 md:w-6 md:h-6" strokeWidth={2.5} />
      </button>

      <button
        onClick={onLove}
        className="w-8 h-8 md:w-12 md:h-12 bg-lime-300 hover:bg-lime-400 rounded-full flex justify-center items-center shadow-lg active:scale-95 text-neutral-900 shrink-0 transition-all cursor-pointer"
        title="Super Love"
      >
        <Heart className="w-3 h-3 md:w-5 md:h-5" fill="currentColor" />
      </button>

      <button
        onClick={onLike}
        className="w-10 h-10 md:w-16 md:h-16 bg-lime-300 hover:bg-lime-400 rounded-full flex justify-center items-center shadow-lg active:scale-95 text-neutral-900 shrink-0 transition-all cursor-pointer"
        title="Match"
      >
        <Check className="w-4 h-4 md:w-6 md:h-6" strokeWidth={3} />
      </button>

      <button
        onClick={() => navigate("/chat")}
        className="w-12 h-12 md:w-20 md:h-20 bg-lime-300 hover:bg-lime-400 rounded-full flex justify-center items-center shadow-lg active:scale-95 text-neutral-900 shrink-0 transition-all cursor-pointer"
        title={`Go to Chat (${matchesCount})`}
      >
        <MessageSquare className="w-5 h-5 md:w-8 md:h-8" strokeWidth={2} />
      </button>
    </div>
  );
};

export default ActionBar;

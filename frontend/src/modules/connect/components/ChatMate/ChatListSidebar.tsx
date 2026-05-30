import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronRight, ArrowLeft, Heart } from "lucide-react";
import { useMatchList } from "../../hooks/useMatchList";

interface ChatListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatListSidebar = ({ isOpen, onClose }: ChatListSidebarProps) => {
  const navigate = useNavigate();
  const { id: activeId } = useParams<{ id: string }>();
  const { matches, loading } = useMatchList(activeId);

  if (!isOpen) return null;

  return (
    <div className="w-80 md:w-96 h-full border-r border-neutral-800 bg-neutral-900 flex flex-col select-none shrink-0 z-20 font-['Inter']">

      {/* Header */}
      <div className="self-stretch px-4 pt-8 pb-4 border-b border-neutral-800 bg-neutral-900 inline-flex justify-start items-center gap-3 shrink-0">
        <Link
          to="/connect"
          className="size-6 text-indigo-50 hover:text-white flex items-center justify-center shrink-0"
          title="Back to Matchmaking"
        >
          <ArrowLeft size={20} />
        </Link>
        <h2 className="flex-1 text-center pr-6 text-indigo-50 text-xl md:text-2xl font-medium truncate uppercase tracking-wide">
          name list
        </h2>
      </div>

      {/* Contacts list */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col justify-start items-start gap-4 scrollbar-none bg-neutral-950">
        {loading ? (
          <div className="w-full p-6 text-center text-xs text-neutral-500 font-mono animate-pulse">
            Scanning signal bands...
          </div>
        ) : matches.length > 0 ? (
          matches.map((survivor) => (
            <div
              key={survivor.id}
              onClick={() => {
                navigate(`/chat/${survivor.id}`);
                onClose();
              }}
              className={`w-full px-4 py-2.5 inline-flex justify-between items-center overflow-hidden cursor-pointer transition-all border-l-2 ${activeId === survivor.id
                ? "bg-neutral-800 border-lime-400 font-semibold"
                : "hover:bg-neutral-900/55 border-transparent"
                }`}
            >
              <div className="flex items-center justify-start gap-4 min-w-0 flex-1">
                {/* Avatar */}
                <div className="size-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-neutral-800 border border-neutral-700 shadow-sm">
                  {survivor.avatarUrl ? (
                    <img src={survivor.avatarUrl} alt={survivor.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-xs text-neutral-950 font-bold uppercase">{survivor.name.charAt(0)}</div>
                  )}
                </div>

                {/* Name */}
                <div className="justify-center text-white text-lg md:text-xl font-medium truncate min-w-0">
                  {survivor.name}
                </div>

                {survivor.matchType === "love" && (
                  <span className="text-[10px] text-purple-400 bg-purple-950/40 border border-purple-500/20 px-1 rounded shrink-0">
                    <Heart fill="currentColor" />
                  </span>
                )}
              </div>

              <div className="size-6 flex justify-center items-center text-white/80 shrink-0">
                <ChevronRight size={18} strokeWidth={2.5} />
              </div>
            </div>
          ))
        ) : (
          <div className="w-full p-6 text-center text-xs text-neutral-500 font-mono">
            No contacts online. Swipe in the Matchmaker feed to establish a signal channel.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatListSidebar;

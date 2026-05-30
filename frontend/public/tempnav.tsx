import { Link, useLocation } from "react-router-dom";

const TempNav = () => {
  const location = useLocation();

  return (
    <div className="self-stretch px-4 pt-8 pb-4 bg-neutral-900 border-b border-neutral-800 inline-flex justify-center items-center shrink-0 z-40 w-full select-none">
      <div className="w-96 flex justify-center items-center gap-7 select-none font-mono">
        <div className="justify-start text-neutral-400 text-xs font-normal tracking-wide">☣️</div>
        <div className="justify-start text-neutral-400 text-xs font-normal tracking-wide cursor-not-allowed">Map</div>
        <div className="justify-start text-neutral-400 text-xs font-normal tracking-wide cursor-not-allowed">RiskFactor</div>
        <Link
          to="/connect"
          className={`justify-start text-xs font-['Space_Mono'] tracking-wide transition-colors ${location.pathname === "/connect"
              ? "text-lime-400 font-bold"
              : "text-neutral-400 font-normal hover:text-white"
            }`}
        >
          Connect
        </Link>
        <div className="justify-start text-neutral-400 text-xs font-normal tracking-wide cursor-not-allowed">AI</div>
      </div>
    </div>
  );
};

export default TempNav;

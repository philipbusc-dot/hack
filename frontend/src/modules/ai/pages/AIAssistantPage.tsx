import { useState } from "react";
import { Panel } from "../../../components/ui";
import StatusLine from "../../../components/StatusLine";
import Footer from "../../../components/Footer";
import { ViewNavList, ViewNavTabs, VIEWS } from "../components/ViewNav";
import ChatbotView from "../components/ChatbotView";
import ActionsView from "../components/ActionsView";
import EvacuationView from "../components/EvacuationView";
import KnowledgeBase from "../components/KnowledgeBase";
import type { BriefingMode } from "../types/ai.types";

const SUBTITLE =
  "Ask anything about the outbreak. Switch views for an actionable checklist or your evacuation route.";

function ActiveView({ view }: { view: BriefingMode }) {
  if (view === "chat") return <ChatbotView />;
  if (view === "actions") return <ActionsView />;
  return <EvacuationView />;
}

export default function AIAssistantPage() {
  const [view, setView] = useState<BriefingMode>("chat");
  const corner = VIEWS.find((v) => v.id === view)?.corner ?? "";

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-10">
      <div className="flex flex-col gap-[34px] lg:flex-row">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-[312px] shrink-0 flex-col gap-5 lg:flex">
          <StatusLine />
          <div>
            <h1 className="text-[40px] font-extrabold leading-none text-head">
              AI Assistant
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">{SUBTITLE}</p>
          </div>
          <ViewNavList active={view} onChange={setView} />
        </aside>

        {/* Mobile header + tabs */}
        <div className="flex flex-col gap-4 lg:hidden">
          <StatusLine />
          <div>
            <h1 className="text-[29px] font-extrabold leading-none text-head">
              AI Assistant
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              {SUBTITLE}
            </p>
          </div>
          <ViewNavTabs active={view} onChange={setView} />
        </div>

        {/* Right content panel */}
        <div className="flex-1">
          <Panel label={corner} className="flex min-h-[560px] flex-col p-6 pt-10">
            <div className="flex-1">
              <ActiveView view={view} />
            </div>
            <Footer className="mt-6 border-t border-line pt-4" />
          </Panel>
        </div>
      </div>

      {/* CRUD entity: KnowledgeArticle knowledge base (secondary panel) */}
      <KnowledgeBase />
    </main>
  );
}

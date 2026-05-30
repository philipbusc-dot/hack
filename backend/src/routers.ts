import { Router } from "express";
import knowledgeRouter from "./modules/knowledge/routers/knowledge.router";
import aiRouter from "./modules/ai/routers/ai.router";
import authRouter from "./modules/auth/routers/auth.router";
import connectRouter from "./modules/connect/routers/connect.router";
import countryReportRouter from "./modules/countryReport/routers/countryReport.router";
import riskRouter from "./modules/riskScore/routers/risk.router";
import personalRouter from "./modules/personalRisk/routers/personal.router";
import profileRouter from "./modules/profile/routers/profile.router";

const mainRouter = Router();

mainRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "SafeHAIVN", time: new Date().toISOString() });
});

mainRouter.use("/auth", authRouter); //          Authentication (login / signup)
mainRouter.use("/knowledge", knowledgeRouter); // Feature 4 — Knowledge base CRUD
mainRouter.use("/ai", aiRouter); //              Feature 4 — AI Survival Briefing
mainRouter.use("/regions", riskRouter);
mainRouter.use("/personal", personalRouter);
mainRouter.use("/profile", profileRouter); //    Per-user editable profile + stats
mainRouter.use("/connect", connectRouter);
mainRouter.use("/country-reports", countryReportRouter);

export default mainRouter;

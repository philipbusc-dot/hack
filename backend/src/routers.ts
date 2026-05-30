import { Router } from "express";
import knowledgeRouter from "./modules/knowledge/routers/knowledge.router";
import aiRouter from "./modules/ai/routers/ai.router";
import authRouter from "./modules/auth/routers/auth.router";

const mainRouter = Router();

mainRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "SafeHAIVN", time: new Date().toISOString() });
});

mainRouter.use("/auth", authRouter); //          Authentication (login / signup)
mainRouter.use("/knowledge", knowledgeRouter); // Feature 4 — Knowledge base CRUD
mainRouter.use("/ai", aiRouter); //              Feature 4 — AI Survival Briefing

export default mainRouter;

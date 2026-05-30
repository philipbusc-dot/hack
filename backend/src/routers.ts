import { Router } from "express";
import connectRouter from "./modules/connect/routers/connect.router";

const mainRouter = Router();

mainRouter.use("/connect", connectRouter);

export default mainRouter;

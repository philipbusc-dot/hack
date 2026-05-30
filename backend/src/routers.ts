import { Router } from "express";
import connectRouter from "./modules/connect/routers/connect.router";
import countryReportRouter from "./modules/countryReport/routers/countryReport.router";

const mainRouter = Router();

mainRouter.use("/connect", connectRouter);
mainRouter.use("/country-reports", countryReportRouter);

export default mainRouter;

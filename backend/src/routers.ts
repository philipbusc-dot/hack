import { Router } from "express";
import additionRouter from "./modules/addition/routers/addition.router";
import multiplicationRouter from "./modules/multiplication/routers/multiplication.router";
import countryReportRouter from "./modules/countryReport/routers/countryReport.router";

const mainRouter = Router();

mainRouter.use("/addition", additionRouter);
mainRouter.use("/multiplication", multiplicationRouter);
mainRouter.use("/country-reports", countryReportRouter);

export default mainRouter;

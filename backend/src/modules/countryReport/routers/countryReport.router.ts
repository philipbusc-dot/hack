import { Router } from "express";
import {
  create,
  list,
  update,
  remove,
} from "../controllers/countryReport.controller";

const countryReportRouter = Router();

countryReportRouter.post("/", create); // Create
countryReportRouter.get("/", list); // Read all
countryReportRouter.put("/:id", update); // Update by id
countryReportRouter.delete("/:id", remove); // Delete by id

export default countryReportRouter;

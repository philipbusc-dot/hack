import type { Request, Response, NextFunction } from "express";
import { validateCountryReportInput } from "../schemas/countryReport.schema";
import {
  createReport,
  getReports,
  updateReport,
  deleteReport,
} from "../models/countryReport.model";

// CREATE — POST /country-reports
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = validateCountryReportInput(req.body);
    const report = await createReport(input);
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
}

// READ — GET /country-reports
export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const reports = await getReports();
    res.json(reports);
  } catch (err) {
    next(err);
  }
}

// UPDATE — PUT /country-reports/:id
export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const input = validateCountryReportInput(req.body);
    const report = await updateReport(id, input);
    res.json(report);
  } catch (err) {
    next(err);
  }
}

// DELETE — DELETE /country-reports/:id
export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await deleteReport(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

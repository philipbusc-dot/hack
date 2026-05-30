import api from "../../../api";
import type {
  CountryReport,
  CountryReportInput,
} from "../types/countryReport.types";

// READ — get all reports
export async function getReports(): Promise<CountryReport[]> {
  const res = await api.get<CountryReport[]>("/country-reports");
  return res.data;
}

// CREATE — add a report
export async function createReport(
  input: CountryReportInput
): Promise<CountryReport> {
  const res = await api.post<CountryReport>("/country-reports", input);
  return res.data;
}

// UPDATE — edit a report by id
export async function updateReport(
  id: number,
  input: CountryReportInput
): Promise<CountryReport> {
  const res = await api.put<CountryReport>(`/country-reports/${id}`, input);
  return res.data;
}

// DELETE — remove a report by id
export async function deleteReport(id: number): Promise<void> {
  await api.delete(`/country-reports/${id}`);
}

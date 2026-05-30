import type { CountryReportInput } from "../types/countryReport.type";

export function validateCountryReportInput(body: unknown): CountryReportInput {
  const { countryCode, countryName, severity, cases, note } =
    body as Record<string, unknown>;

  if (typeof countryCode !== "string" || countryCode.trim() === "") {
    throw Object.assign(new Error("countryCode is required"), { status: 400 });
  }
  if (typeof countryName !== "string" || countryName.trim() === "") {
    throw Object.assign(new Error("countryName is required"), { status: 400 });
  }
  if (typeof severity !== "string") {
    throw Object.assign(new Error("severity must be a string"), { status: 400 });
  }
  if (typeof cases !== "number") {
    throw Object.assign(new Error("cases must be a number"), { status: 400 });
  }

  return {
    countryCode,
    countryName,
    severity,
    cases,
    note: typeof note === "string" ? note : "",
  };
}

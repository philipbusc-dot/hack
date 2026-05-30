export interface CountryReportInput {
  countryCode: string;
  countryName: string;
  severity: string; // "High" | "Moderate" | "Low"
  cases: number;
  note: string;
}

export interface CountryReport extends CountryReportInput {
  id: number;
  createAt: string;
  updateAt: string;
}

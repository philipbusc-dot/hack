// Shape of one country's live stats from disease.sh
export interface Stat {
  country: string;
  cases: number;
  deaths: number;
  recovered: number;
  active: number;
  casesPerOneMillion: number;
  population: number;
  countryInfo?: { iso2?: string };
}

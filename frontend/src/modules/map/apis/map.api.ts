import type { Stat } from "../types/map.types";

// Country border shapes (GeoJSON)
const GEO =
  "https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson";

// Live world data — external, read-only (not our backend, so plain fetch)
export async function fetchCountries(): Promise<Stat[]> {
  const res = await fetch("https://disease.sh/v3/covid-19/countries");
  if (!res.ok) throw new Error(`disease.sh ${res.status}`);
  return res.json();
}

export async function fetchGeo(): Promise<{ features: any[] }> {
  const res = await fetch(GEO);
  if (!res.ok) throw new Error(`geojson ${res.status}`);
  return res.json();
}

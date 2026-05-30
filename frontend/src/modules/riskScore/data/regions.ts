import type { DangerLevel, RegionInput } from "../types/risk.types";

export const REGIONS: (RegionInput & { label: string })[] = [
  { label: "Bangkok, Thailand", country: "TH", lat: 13.7563, lng: 100.5018 },
  { label: "New York, USA", country: "US", lat: 40.7128, lng: -74.006 },
  { label: "London, UK", country: "GB", lat: 51.5074, lng: -0.1278 },
  { label: "Tokyo, Japan", country: "JP", lat: 35.6762, lng: 139.6503 },
  { label: "Singapore", country: "SG", lat: 1.3521, lng: 103.8198 },
  { label: "Delhi, India", country: "IN", lat: 28.6139, lng: 77.209 },
  { label: "Sao Paulo, Brazil", country: "BR", lat: -23.5505, lng: -46.6333 },
];

export const DANGER_STYLE: Record<DangerLevel, { hex: string; text: string }> = {
  LOW: { hex: "#a4d233", text: "text-lime" },
  MODERATE: { hex: "#e0922b", text: "text-amber" },
  HIGH: { hex: "#e2473a", text: "text-danger" },
};

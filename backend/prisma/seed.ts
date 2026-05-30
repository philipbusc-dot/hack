/**
 * SafeHAIVN database seed.
 *
 *  • CountryReport  — pulled LIVE from the free, no-auth disease.sh COVID-19
 *                     feed (proof-of-concept real data). Falls back to an
 *                     embedded snapshot if the network is unavailable.
 *  • RegionRisk     — hand-authored regions scored with computeRegionalRisk().
 *  • SurvivorMate   — survivors around the Bangkok default locale, PSI-scored.
 *  • KnowledgeArticle — historical pandemics + survival knowledge base.
 */
import { prisma } from "../src/db";
import {
  classifyCountryDanger,
  computeRegionalRisk,
  computePSI,
} from "../src/lib/formulas";

const BANGKOK = { lat: 13.7563, lng: 100.5018 };

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface RawCountry {
  countryCode: string;
  countryName: string;
  infectedCount: number;
  deathCount: number;
  recoveryCount: number;
  casesPerOneMillion?: number;
  population?: number;
}

/** Embedded fallback (cumulative COVID-19 snapshot) if disease.sh is down. */
const FALLBACK_COUNTRIES: RawCountry[] = [
  { countryCode: "US", countryName: "United States", infectedCount: 111820082, deathCount: 1219487, recoveryCount: 109814428, casesPerOneMillion: 333687, population: 335129155 },
  { countryCode: "IN", countryName: "India", infectedCount: 45035393, deathCount: 533570, recoveryCount: 44469736, casesPerOneMillion: 31889, population: 1412542696 },
  { countryCode: "BR", countryName: "Brazil", infectedCount: 38743918, deathCount: 711380, recoveryCount: 36249161, casesPerOneMillion: 179327, population: 216044150 },
  { countryCode: "FR", countryName: "France", infectedCount: 38997490, deathCount: 167642, recoveryCount: 38829848, casesPerOneMillion: 593989, population: 65647497 },
  { countryCode: "DE", countryName: "Germany", infectedCount: 38437756, deathCount: 174979, recoveryCount: 38240000, casesPerOneMillion: 457120, population: 84083360 },
  { countryCode: "GB", countryName: "United Kingdom", infectedCount: 24910387, deathCount: 232112, recoveryCount: 24628126, casesPerOneMillion: 363502, population: 68521940 },
  { countryCode: "IT", countryName: "Italy", infectedCount: 26723249, deathCount: 196469, recoveryCount: 26200000, casesPerOneMillion: 444212, population: 60156558 },
  { countryCode: "RU", countryName: "Russia", infectedCount: 23829261, deathCount: 400376, recoveryCount: 23173838, casesPerOneMillion: 163220, population: 145997150 },
  { countryCode: "JP", countryName: "Japan", infectedCount: 33803572, deathCount: 74694, recoveryCount: 33728878, casesPerOneMillion: 271453, population: 124516650 },
  { countryCode: "KR", countryName: "South Korea", infectedCount: 34571873, deathCount: 35934, recoveryCount: 34500000, casesPerOneMillion: 673379, population: 51329899 },
  { countryCode: "CN", countryName: "China", infectedCount: 503302, deathCount: 5272, recoveryCount: 379053, casesPerOneMillion: 349, population: 1439323776 },
  { countryCode: "TH", countryName: "Thailand", infectedCount: 4770149, deathCount: 34586, recoveryCount: 4692636, casesPerOneMillion: 68069, population: 70078203 },
  { countryCode: "VN", countryName: "Vietnam", infectedCount: 11624000, deathCount: 43206, recoveryCount: 10610000, casesPerOneMillion: 117384, population: 99025782 },
  { countryCode: "ID", countryName: "Indonesia", infectedCount: 6816569, deathCount: 161918, recoveryCount: 6644380, casesPerOneMillion: 24336, population: 280069246 },
  { countryCode: "MY", countryName: "Malaysia", infectedCount: 5119161, deathCount: 37204, recoveryCount: 5081000, casesPerOneMillion: 153075, population: 33442700 },
  { countryCode: "SG", countryName: "Singapore", infectedCount: 2868552, deathCount: 1924, recoveryCount: 2866000, casesPerOneMillion: 477194, population: 6010000 },
  { countryCode: "PH", countryName: "Philippines", infectedCount: 4140383, deathCount: 66864, recoveryCount: 4070000, casesPerOneMillion: 36015, population: 114945000 },
  { countryCode: "AU", countryName: "Australia", infectedCount: 11861161, deathCount: 24919, recoveryCount: 11800000, casesPerOneMillion: 451178, population: 26292240 },
  { countryCode: "ZA", countryName: "South Africa", infectedCount: 4072533, deathCount: 102595, recoveryCount: 3960000, casesPerOneMillion: 66837, population: 60940000 },
  { countryCode: "MX", countryName: "Mexico", infectedCount: 7690757, deathCount: 334958, recoveryCount: 6890000, casesPerOneMillion: 58530, population: 131400000 },
  { countryCode: "CA", countryName: "Canada", infectedCount: 4946180, deathCount: 59016, recoveryCount: 4880000, casesPerOneMillion: 128516, population: 38489432 },
  { countryCode: "ES", countryName: "Spain", infectedCount: 13980340, deathCount: 121760, recoveryCount: 13850000, casesPerOneMillion: 298599, population: 46815916 },
  { countryCode: "AR", countryName: "Argentina", infectedCount: 10080046, deathCount: 130685, recoveryCount: 9990000, casesPerOneMillion: 218224, population: 46189216 },
  { countryCode: "EG", countryName: "Egypt", infectedCount: 516023, deathCount: 24830, recoveryCount: 440000, casesPerOneMillion: 4838, population: 106156692 },
  { countryCode: "NG", countryName: "Nigeria", infectedCount: 267184, deathCount: 3155, recoveryCount: 264000, casesPerOneMillion: 1224, population: 218300000 },
];

async function fetchLiveCountries(): Promise<RawCountry[] | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(
      "https://disease.sh/v3/covid-19/countries?yesterday=false&allowNull=false",
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      country: string;
      countryInfo: { iso2: string | null };
      cases: number;
      deaths: number;
      recovered: number;
      casesPerOneMillion: number;
      population: number;
    }>;
    return data
      .filter((d) => d.countryInfo?.iso2)
      .map((d) => ({
        countryCode: d.countryInfo.iso2 as string,
        countryName: d.country,
        infectedCount: d.cases ?? 0,
        deathCount: d.deaths ?? 0,
        recoveryCount: d.recovered ?? 0,
        casesPerOneMillion: d.casesPerOneMillion ?? 0,
        population: d.population ?? 0,
      }));
  } catch {
    return null;
  }
}

async function seedCountries() {
  const live = await fetchLiveCountries();
  const rows = live ?? FALLBACK_COUNTRIES;
  console.log(
    `  → ${rows.length} countries (${live ? "LIVE disease.sh" : "embedded fallback"})`
  );
  await prisma.countryReport.deleteMany();
  for (const c of rows) {
    const dangerLevel = classifyCountryDanger(c);
    await prisma.countryReport.create({
      data: {
        countryCode: c.countryCode,
        countryName: c.countryName,
        infectedCount: c.infectedCount,
        deathCount: c.deathCount,
        recoveryCount: c.recoveryCount,
        dangerLevel,
      },
    });
  }
}

async function seedRegions() {
  const regions = [
    { countryCode: "TH", regionName: "Bangkok Metropolis", infectionRate: 8.4, populationDensity: 5300, airportTraffic: 92, humidity: 74, hospitalStrain: 88 },
    { countryCode: "TH", regionName: "Chiang Mai", infectionRate: 3.1, populationDensity: 1200, airportTraffic: 48, humidity: 66, hospitalStrain: 52 },
    { countryCode: "TH", regionName: "Phuket", infectionRate: 5.7, populationDensity: 1600, airportTraffic: 71, humidity: 80, hospitalStrain: 63 },
    { countryCode: "SG", regionName: "Singapore Central", infectionRate: 6.2, populationDensity: 8400, airportTraffic: 98, humidity: 83, hospitalStrain: 70 },
    { countryCode: "VN", regionName: "Ho Chi Minh City", infectionRate: 7.1, populationDensity: 4500, airportTraffic: 80, humidity: 78, hospitalStrain: 81 },
    { countryCode: "MY", regionName: "Kuala Lumpur", infectionRate: 4.9, populationDensity: 8200, airportTraffic: 76, humidity: 82, hospitalStrain: 67 },
    { countryCode: "JP", regionName: "Tokyo Prefecture", infectionRate: 4.2, populationDensity: 6400, airportTraffic: 95, humidity: 63, hospitalStrain: 58 },
  ];
  await prisma.regionRisk.deleteMany();
  for (const r of regions) {
    const regionalRisk = computeRegionalRisk(r);
    await prisma.regionRisk.create({ data: { ...r, regionalRisk } });
  }
  console.log(`  → ${regions.length} regions`);
}

async function seedMates() {
  // Bangkok regional risk drives PSI; distance reduces it.
  const bangkokRisk = computeRegionalRisk({
    infectionRate: 8.4,
    populationDensity: 5300,
    airportTraffic: 92,
    humidity: 74,
    hospitalStrain: 88,
  });

  const mates = [
    { username: "Ravme?", lat: 13.745, lng: 100.534, infectionStatus: "CLEAN", compatibilityScore: 91, verifiedClean: true },
    { username: "MedicJoy", lat: 13.766, lng: 100.539, infectionStatus: "CLEAN", compatibilityScore: 88, verifiedClean: true },
    { username: "Nok_Survivor", lat: 13.73, lng: 100.521, infectionStatus: "CLEAN", compatibilityScore: 82, verifiedClean: true },
    { username: "GhostRunner", lat: 13.79, lng: 100.55, infectionStatus: "EXPOSED", compatibilityScore: 64, verifiedClean: false },
    { username: "Apinya.W", lat: 13.71, lng: 100.49, infectionStatus: "CLEAN", compatibilityScore: 77, verifiedClean: true },
    { username: "RiverRat", lat: 13.82, lng: 100.61, infectionStatus: "INFECTED", compatibilityScore: 22, verifiedClean: false },
    { username: "Saber_TH", lat: 13.70, lng: 100.60, infectionStatus: "UNKNOWN", compatibilityScore: 51, verifiedClean: false },
    { username: "QuietDoc", lat: 13.755, lng: 100.50, infectionStatus: "CLEAN", compatibilityScore: 95, verifiedClean: true },
    { username: "Mookie", lat: 13.68, lng: 100.47, infectionStatus: "EXPOSED", compatibilityScore: 58, verifiedClean: false },
    { username: "Pol.S", lat: 13.84, lng: 100.52, infectionStatus: "CLEAN", compatibilityScore: 73, verifiedClean: true },
    { username: "WolfPackTH", lat: 13.66, lng: 100.62, infectionStatus: "INFECTED", compatibilityScore: 18, verifiedClean: false },
    { username: "Lyn_Medkit", lat: 13.77, lng: 100.48, infectionStatus: "CLEAN", compatibilityScore: 86, verifiedClean: true },
  ];

  await prisma.survivorMate.deleteMany();
  for (const m of mates) {
    const d = haversineKm(BANGKOK.lat, BANGKOK.lng, m.lat, m.lng);
    // Infected/exposed people raise effective risk; distance + cleanliness lower it.
    const statusPenalty =
      m.infectionStatus === "INFECTED"
        ? 30
        : m.infectionStatus === "EXPOSED"
          ? 12
          : m.infectionStatus === "UNKNOWN"
            ? 6
            : 0;
    const effRisk = Math.min(100, bangkokRisk + statusPenalty);
    const personalRiskIndex = computePSI(effRisk, d);
    await prisma.survivorMate.create({
      data: {
        username: m.username,
        latitude: m.lat,
        longitude: m.lng,
        infectionStatus: m.infectionStatus,
        compatibilityScore: m.compatibilityScore,
        personalRiskIndex,
        verifiedClean: m.verifiedClean,
      },
    });
  }
  console.log(`  → ${mates.length} survivors`);
}

async function seedKnowledge() {
  const articles = [
    { title: "Plague of Justinian (541–549 AD)", category: "HISTORY", source: "Historical record", content: "One of the first recorded bubonic plague pandemics, striking the Byzantine Empire. Estimated 15–100 million deaths across recurring waves over two centuries. Spread along grain-trade and maritime routes — an early lesson that mobility corridors are infection corridors." },
    { title: "The Black Death (1347–1351)", category: "HISTORY", source: "Historical record", content: "Bubonic plague that killed an estimated 75–200 million people across Eurasia and North Africa, wiping out 30–60% of Europe's population. Quarantine (Italian 'quaranta giorni' — forty days) was born here: ships were held offshore before docking." },
    { title: "1918 Influenza (Spanish Flu)", category: "HISTORY", source: "Historical record", content: "H1N1 influenza infected roughly a third of the world's population and killed an estimated 50 million. Unusually lethal for healthy young adults. Cities that closed schools and banned gatherings early saw markedly lower death rates — the original case for flattening the curve." },
    { title: "HIV/AIDS Pandemic (1981–present)", category: "HISTORY", source: "Historical record", content: "A slow-moving pandemic that has caused over 40 million deaths. Transformed from a death sentence to a manageable condition through antiretroviral therapy — a reminder that sustained science changes outcomes even without a cure." },
    { title: "COVID-19 (2019–present)", category: "HISTORY", source: "disease.sh / WHO", content: "SARS-CoV-2 spread globally within months of emergence, causing millions of deaths and reshaping travel, work and healthcare. Demonstrated how air travel turns a local outbreak into a worldwide event in weeks — and how fast vaccines can be developed under pressure." },
    { title: "How Respiratory Outbreaks Spread", category: "GUIDE", source: "SafeHAIVN briefing", content: "Most fast-moving outbreaks spread through close-contact respiratory droplets and contaminated surfaces. Risk multiplies in crowded, poorly ventilated indoor spaces and along high-traffic travel corridors. Distance, ventilation and time-limited exposure are your strongest passive defenses." },
    { title: "What to Pack: 72-Hour Survival Kit", category: "GUIDE", source: "SafeHAIVN briefing", content: "Water (4L/person/day, 3 days), shelf-stable food, N95 masks, gloves, a basic medkit and any personal prescriptions, water purification tablets, a power bank and torch, paper maps of evacuation routes, cash in small denominations, and copies of ID. Pack light enough to move on foot." },
    { title: "Finding a Safe Zone", category: "GUIDE", source: "SafeHAIVN briefing", content: "Prioritise low population density, defensible water access, and distance from major transit hubs and hospitals under strain. Verified-clean survivor clusters are safer than going solo. Move toward higher, drier ground when humidity and hospital strain are both elevated." },
    { title: "Evacuation Basics", category: "GUIDE", source: "SafeHAIVN briefing", content: "Leave before routes saturate — the safest departure window is early. Travel against the crowd flow where possible, avoid choke points (bridges, terminals), keep a charged comms device, and agree a rally point with your group in case you're separated." },
  ];
  await prisma.knowledgeArticle.deleteMany();
  for (const a of articles) {
    await prisma.knowledgeArticle.create({ data: a });
  }
  console.log(`  → ${articles.length} knowledge articles`);
}

async function main() {
  console.log("Seeding SafeHAIVN database…");
  await seedCountries();
  await seedRegions();
  await seedMates();
  await seedKnowledge();
  console.log("Seed complete. ☣");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

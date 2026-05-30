/**
 * Connect seed (post User↔Survivor merge).
 * Survivors are now plain Users. We seed 8 "nearby" survivor accounts and
 * enrich the admin account with location + supplies so logging in as admin
 * gives a populated matchmaking feed out of the box.
 */
import { prisma } from "../../db";
import { hashPassword } from "../../lib/auth";

// Synthetic domain marks seed-created survivor accounts so re-seeding only
// removes those (never real signups, the admin, or the personalRisk demo user).
const SURVIVOR_DOMAIN = "@bunker.local";

type Stat = { name: string; value: number; unit: string };
type SurvivorSeed = {
  username: string;
  age: number;
  description: string;
  baseLocation: string;
  lat: number;
  lng: number;
  photoUrl: string;
  stats: Stat[];
};

const survivors: SurvivorSeed[] = [
  {
    username: "Alex",
    age: 27,
    description: "Just some survivor, wish life would go back the way it was tho...",
    baseLocation: "Bunker Delta-6",
    lat: 13.7663,
    lng: 100.5058,
    photoUrl: "http://localhost:3000/uploads/alex-suprun-ZHvM3XIOHoE-unsplash.jpg",
    stats: [
      { name: "Medkit", value: 3, unit: "units" },
      { name: "Water Stock", value: 5, unit: "days" },
      { name: "Food Stock", value: 7, unit: "days" },
    ],
  },
  {
    username: "Jordan",
    age: 29,
    description: "Combat medic. Seeking stable shelter and secure perimeter partners.",
    baseLocation: "Sector 7 Ruins",
    lat: 13.7863,
    lng: 100.5118,
    photoUrl: "http://localhost:3000/uploads/eddy-lackmann-lLdGG3ESoiI-unsplash.jpg",
    stats: [
      { name: "Medkit", value: 25, unit: "units" },
      { name: "Water Stock", value: 14, unit: "days" },
      { name: "Food Stock", value: 10, unit: "days" },
    ],
  },
  {
    username: "Taylor",
    age: 25,
    description: "Greenhouse botanist. Growing crops in the wasteland is my passion.",
    baseLocation: "Greenhouse Area 4",
    lat: 13.8263,
    lng: 100.5218,
    photoUrl: "http://localhost:3000/uploads/michael-dam-mEZ3PoFGs_k-unsplash.jpg",
    stats: [
      { name: "Medkit", value: 8, unit: "units" },
      { name: "Water Stock", value: 21, unit: "days" },
      { name: "Food Stock", value: 30, unit: "days" },
    ],
  },
  {
    username: "Morgan",
    age: 26,
    description:
      "Tech archivist and code scavenger. Finding pre-war server drives is my specialty.",
    baseLocation: "Sub-level 4 Crypts",
    lat: 13.8863,
    lng: 100.5318,
    photoUrl: "http://localhost:3000/uploads/aiony-haust-3TLl_97HNJo-unsplash.jpg",
    stats: [
      { name: "Medkit", value: 1, unit: "units" },
      { name: "Water Stock", value: 45, unit: "days" },
      { name: "Food Stock", value: 60, unit: "days" },
    ],
  },
  {
    username: "Casey",
    age: 31,
    description: "Scrap metal welder and heavy defense mechanic. Exo-suit constructor.",
    baseLocation: "The Junkyard Outpost",
    lat: 13.8063,
    lng: 100.5158,
    photoUrl: "http://localhost:3000/uploads/stefan-stefancik-QXevDflbl8A-unsplash.jpg",
    stats: [
      { name: "Medkit", value: 4, unit: "units" },
      { name: "Water Stock", value: 3, unit: "days" },
      { name: "Food Stock", value: 4, unit: "days" },
    ],
  },
  {
    username: "Riley",
    age: 24,
    description: "Radio tower technician. Re-broadcasting pre-war synthwave.",
    baseLocation: "Echo Signal Tower",
    lat: 13.8363,
    lng: 100.5258,
    photoUrl: "http://localhost:3000/uploads/linkedin-sales-solutions-pAtA8xe_iVM-unsplash.jpg",
    stats: [
      { name: "Medkit", value: 6, unit: "units" },
      { name: "Water Stock", value: 10, unit: "days" },
      { name: "Food Stock", value: 8, unit: "days" },
    ],
  },
  {
    username: "Cameron",
    age: 28,
    description: "Outer perimeter scout. Fast runner, excellent trap setter.",
    baseLocation: "Outer Ruins Zone A",
    lat: 13.7653,
    lng: 100.4958,
    photoUrl: "http://localhost:3000/uploads/alex-suprun-ZHvM3XIOHoE-unsplash.jpg",
    stats: [
      { name: "Medkit", value: 0, unit: "units" },
      { name: "Water Stock", value: 2, unit: "days" },
      { name: "Food Stock", value: 1, unit: "days" },
    ],
  },
  {
    username: "Avery",
    age: 30,
    description: "Citadel security officer. Managing power banks and solar cell storage.",
    baseLocation: "Gate 3 Citadel",
    lat: 13.8463,
    lng: 100.5358,
    photoUrl: "http://localhost:3000/uploads/michael-dam-mEZ3PoFGs_k-unsplash.jpg",
    stats: [
      { name: "Medkit", value: 9, unit: "units" },
      { name: "Water Stock", value: 18, unit: "days" },
      { name: "Food Stock", value: 25, unit: "days" },
    ],
  },
];

async function main() {
  console.log("Seeding survivor accounts (Connect)…");

  // Matches/messages reference user ids loosely; they're disposable demo data.
  await prisma.chatMessage.deleteMany();
  await prisma.match.deleteMany();
  // Remove only previously-seeded survivor accounts (cascades their stats).
  await prisma.user.deleteMany({ where: { email: { endsWith: SURVIVOR_DOMAIN } } });

  const placeholderHash = await hashPassword("survivor-demo");

  for (const s of survivors) {
    await prisma.user.create({
      data: {
        email: `${s.username.toLowerCase()}${SURVIVOR_DOMAIN}`,
        username: s.username,
        passwordHash: placeholderHash,
        role: "survivor",
        age: s.age,
        baseLocation: s.baseLocation,
        description: s.description,
        photoUrl: s.photoUrl,
        lat: s.lat,
        lng: s.lng,
        stats: { create: s.stats },
      },
    });
    console.log(`  → survivor: ${s.username}`);
  }

  // Enrich the admin so the logged-in "current user" has location + supplies,
  // giving a populated matchmaking feed (distance + compatibility) on first run.
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@safehaivn.local").toLowerCase();
  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        age: 26,
        baseLocation: "Bunker Main-A",
        description: "Managing clean water filtration systems in bunker sector A.",
        photoUrl:
          "http://localhost:3000/uploads/linkedin-sales-solutions-pAtA8xe_iVM-unsplash.jpg",
        lat: 13.7563,
        lng: 100.5018,
      },
    });
    // Replace the admin's stats with the canonical survivor supply set.
    await prisma.survivalStat.deleteMany({ where: { userId: admin.id } });
    await prisma.survivalStat.createMany({
      data: [
        { name: "Medkit", value: 12, unit: "units", userId: admin.id },
        { name: "Water Stock", value: 30, unit: "days", userId: admin.id },
        { name: "Food Stock", value: 20, unit: "days", userId: admin.id },
      ],
    });
    console.log(`  → enriched admin (${adminEmail}) as the demo current user`);
  } else {
    console.warn(`  ! admin (${adminEmail}) not found — run prisma/seed.ts first`);
  }

  console.log("Connect seed complete. ☣");
}

main()
  .catch((e) => {
    console.error("Connect seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";

const adapter = new PrismaLibSql({
  url: process.env["DATABASE_URL"]!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Emptying database...");
  await prisma.chatMessage.deleteMany();
  await prisma.match.deleteMany();
  await prisma.supply.deleteMany();
  await prisma.survivor.deleteMany();

  console.log("Seeding current user profile ('You')...");
  const currentUser = await prisma.survivor.create({
    data: {
      name: "You",
      age: 26,
      bio: "Managing clean water filtration systems in bunker sector A.",
      baseLocation: "Bunker Main-A",
      latitude: 13.7563,
      longitude: 100.5018,
      avatarUrl: "http://localhost:3000/uploads/linkedin-sales-solutions-pAtA8xe_iVM-unsplash.jpg",
      isCurrentUser: true,
      supplies: {
        create: [
          { label: "Medkit", value: 12, unit: "units" },
          { label: "Water Stock", value: 30, unit: "days" },
          { label: "Food Stock", value: 20, unit: "days" },
        ]
      }
    }
  });

  console.log("Seeding nearby survivor profiles...");
  const survivorsData = [
    {
      name: "Alex",
      age: 27,
      bio: "Just some survivor, wish life would go back the way it was tho...",
      baseLocation: "Bunker Delta-6",
      latitude: 13.7663,
      longitude: 100.5058,
      avatarUrl: "http://localhost:3000/uploads/alex-suprun-ZHvM3XIOHoE-unsplash.jpg",
      isCurrentUser: false,
      supplies: {
        create: [
          { label: "Medkit", value: 3, unit: "units" },
          { label: "Water Stock", value: 5, unit: "days" },
          { label: "Food Stock", value: 7, unit: "days" },
        ]
      }
    },
    {
      name: "Jordan",
      age: 29,
      bio: "Combat medic. Seeking stable shelter and secure perimeter partners.",
      baseLocation: "Sector 7 Ruins",
      latitude: 13.7863,
      longitude: 100.5118,
      avatarUrl: "http://localhost:3000/uploads/eddy-lackmann-lLdGG3ESoiI-unsplash.jpg",
      isCurrentUser: false,
      supplies: {
        create: [
          { label: "Medkit", value: 25, unit: "units" },
          { label: "Water Stock", value: 14, unit: "days" },
          { label: "Food Stock", value: 10, unit: "days" },
        ]
      }
    },
    {
      name: "Taylor",
      age: 25,
      bio: "Greenhouse botanist. Growing crops in the wasteland is my passion.",
      baseLocation: "Greenhouse Area 4",
      latitude: 13.8263,
      longitude: 100.5218,
      avatarUrl: "http://localhost:3000/uploads/michael-dam-mEZ3PoFGs_k-unsplash.jpg",
      isCurrentUser: false,
      supplies: {
        create: [
          { label: "Medkit", value: 8, unit: "units" },
          { label: "Water Stock", value: 21, unit: "days" },
          { label: "Food Stock", value: 30, unit: "days" },
        ]
      }
    },
    {
      name: "Morgan",
      age: 26,
      bio: "Tech archivist and code scavenger. Finding pre-war server drives is my specialty.",
      baseLocation: "Sub-level 4 Crypts",
      latitude: 13.8863,
      longitude: 100.5318,
      avatarUrl: "http://localhost:3000/uploads/aiony-haust-3TLl_97HNJo-unsplash.jpg",
      isCurrentUser: false,
      supplies: {
        create: [
          { label: "Medkit", value: 1, unit: "units" },
          { label: "Water Stock", value: 45, unit: "days" },
          { label: "Food Stock", value: 60, unit: "days" },
        ]
      }
    },
    {
      name: "Casey",
      age: 31,
      bio: "Scrap metal welder and heavy defense mechanic. Exo-suit constructor.",
      baseLocation: "The Junkyard Outpost",
      latitude: 13.8063,
      longitude: 100.5158,
      avatarUrl: "http://localhost:3000/uploads/stefan-stefancik-QXevDflbl8A-unsplash.jpg",
      isCurrentUser: false,
      supplies: {
        create: [
          { label: "Medkit", value: 4, unit: "units" },
          { label: "Water Stock", value: 3, unit: "days" },
          { label: "Food Stock", value: 4, unit: "days" },
        ]
      }
    },
    {
      name: "Riley",
      age: 24,
      bio: "Radio tower technician. Re-broadcasting pre-war synthwave.",
      baseLocation: "Echo Signal Tower",
      latitude: 13.8363,
      longitude: 100.5258,
      avatarUrl: "http://localhost:3000/uploads/linkedin-sales-solutions-pAtA8xe_iVM-unsplash.jpg",
      isCurrentUser: false,
      supplies: {
        create: [
          { label: "Medkit", value: 6, unit: "units" },
          { label: "Water Stock", value: 10, unit: "days" },
          { label: "Food Stock", value: 8, unit: "days" },
        ]
      }
    },
    {
      name: "Cameron",
      age: 28,
      bio: "Outer perimeter scout. Fast runner, excellent trap setter.",
      baseLocation: "Outer Ruins Zone A",
      latitude: 13.7653,
      longitude: 100.4958,
      avatarUrl: "http://localhost:3000/uploads/alex-suprun-ZHvM3XIOHoE-unsplash.jpg",
      isCurrentUser: false,
      supplies: {
        create: [
          { label: "Medkit", value: 0, unit: "units" },
          { label: "Water Stock", value: 2, unit: "days" },
          { label: "Food Stock", value: 1, unit: "days" },
        ]
      }
    },
    {
      name: "Avery",
      age: 30,
      bio: "Citadel security officer. Managing power banks and solar cell storage.",
      baseLocation: "Gate 3 Citadel",
      latitude: 13.8463,
      longitude: 100.5358,
      avatarUrl: "http://localhost:3000/uploads/michael-dam-mEZ3PoFGs_k-unsplash.jpg",
      isCurrentUser: false,
      supplies: {
        create: [
          { label: "Medkit", value: 9, unit: "units" },
          { label: "Water Stock", value: 18, unit: "days" },
          { label: "Food Stock", value: 25, unit: "days" },
        ]
      }
    }
  ];

  for (const s of survivorsData) {
    const created = await prisma.survivor.create({ data: s });
    console.log(`Created survivor: ${created.name}`);
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

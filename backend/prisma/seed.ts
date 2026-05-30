/**
 * SafeHAIVN database seed (AI feature scope).
 *   • KnowledgeArticle — historical pandemics + survival knowledge base,
 *     used by the AI Survival Briefing chatbot (RAG-lite) and the
 *     Knowledge Base CRUD panel.
 */
import { prisma } from "../src/db";
import { hashPassword } from "../src/lib/auth";

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

async function seedAdmin() {
  // The ONLY way an admin account is created. Credentials come from .env
  // (with safe-ish dev defaults). Signup can never grant the admin role.
  const email = (process.env.ADMIN_EMAIL ?? "admin@safehaivn.local").toLowerCase();
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123";
  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { email },
    update: { username, passwordHash, role: "admin" },
    create: { email, username, passwordHash, role: "admin" },
  });
  console.log(`  → admin user (login: "${email}" or "${username}")`);
}

async function main() {
  console.log("Seeding SafeHAIVN database…");
  await seedKnowledge();
  await seedAdmin();
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

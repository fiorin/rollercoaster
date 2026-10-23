import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually. ES module imports are hoisted, so everything that
// depends on these values has to be imported dynamically afterwards.
const envPath = path.resolve(__dirname, "../.env");
const envVars = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    envVars[key] = value;
  }
}

process.env.VITE_SUPABASE_URL =
  envVars.VITE_SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL;
process.env.VITE_SUPABASE_ANON_KEY =
  envVars.VITE_SUPABASE_ANON_KEY ||
  envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const { loadPeople, saveWeights } = await import("../src/utils/storage.js");
const { addDays, addMonths, dateKey } = await import("../src/utils/date.js");

async function seedMonthlyWeights() {
  try {
    const people = await loadPeople();
    if (!people.length) {
      console.log("No people found. Please add people first.");
      return;
    }

    const personId = people[0].id;

    // One entry per week for the past six months.
    const startDate = dateKey(addMonths(new Date(), -6));
    const endDate = dateKey(new Date());
    const weights = [];
    let cursor = startDate;
    let baseWeight = 72;

    while (cursor <= endDate) {
      const variation = (Math.random() - 0.5) * 2; // -1 to +1 kg
      weights.push({
        personId,
        date: cursor,
        kg: Math.round((baseWeight + variation) * 10) / 10,
        activities: {
          gym: Math.random() > 0.5,
          bike: Math.random() > 0.7,
          boxing: Math.random() > 0.8,
          run: Math.random() > 0.6,
        },
      });

      baseWeight -= 0.05;
      cursor = dateKey(addDays(cursor, 7));
    }

    const saved = await saveWeights(weights);
    console.log(`Saved ${saved.length} weekly weights for ${personId}.`);
  } catch (err) {
    console.error("Error seeding monthly weights:", err);
  }
}

seedMonthlyWeights();

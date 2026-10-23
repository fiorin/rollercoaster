import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually. ES module imports are hoisted, so the Supabase client
// has to be imported dynamically after the environment is populated.
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

async function seedWeights() {
  try {
    const people = await loadPeople();
    if (!people.length) {
      console.log("No people found. Please add people first.");
      return;
    }

    const personId = people[0].id;
    const sampleWeights = [
      {
        personId,
        date: "2024-04-20",
        kg: 70.5,
        activities: { gym: true, bike: false, boxing: false, run: true },
      },
      {
        personId,
        date: "2024-04-21",
        kg: 70.2,
        activities: { gym: false, bike: true, boxing: true, run: false },
      },
    ];

    const saved = await saveWeights(sampleWeights);
    console.log(`Sample weights saved: ${saved.length}`);
  } catch (err) {
    console.error("Error seeding weights:", err);
  }
}

seedWeights();

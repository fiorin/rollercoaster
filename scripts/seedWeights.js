import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually
const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
envContent.split("\n").forEach(line => {
  const [key, value] = line.split("=");
  if (key && value) envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, "");
});

// Set process.env
process.env.VITE_SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
process.env.VITE_SUPABASE_ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

import { supabase } from "../src/lib/supabaseClient.js";

async function seedWeights() {
  try {
    // Fetch existing people
    const { data: people, error: peopleError } = await supabase
      .from("people")
      .select("id")
      .limit(1);
    if (peopleError) throw peopleError;
    if (!people || people.length === 0) {
      console.log("No people found. Please add people first.");
      return;
    }

    const personId = people[0].id;

    const sampleWeights = [
      {
        person_id: personId,
        date: "2024-04-20",
        weight: 70.5,
        gym: true,
        bike: false,
        gloves: false,
        running: true,
      },
      {
        person_id: personId,
        date: "2024-04-21",
        weight: 70.2,
        gym: false,
        bike: true,
        gloves: true,
        running: false,
      },
    ];

    const { data, error } = await supabase.from("weights").insert(sampleWeights);
    if (error) throw error;
    console.log("Sample weights inserted:", data);
  } catch (err) {
    console.error("Error seeding weights:", err);
  }
}

seedWeights();
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
import dayjs from "dayjs";

async function seedMonthlyWeights() {
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

    // Generate weights for the past 6 months, one per week
    const weights = [];
    const startDate = dayjs().subtract(6, "month");
    let currentDate = startDate;
    let baseWeight = 72.0; // Starting weight

    while (currentDate.isBefore(dayjs())) {
      // Vary weight slightly to simulate progress
      const variation = (Math.random() - 0.5) * 2; // -1 to +1 kg
      const weight = Math.round((baseWeight + variation) * 10) / 10;

      weights.push({
        person_id: personId,
        date: currentDate.format("YYYY-MM-DD"),
        weight,
        gym: Math.random() > 0.5,
        bike: Math.random() > 0.7,
        gloves: Math.random() > 0.8,
        running: Math.random() > 0.6,
      });

      // Gradually decrease weight over time
      baseWeight -= 0.05;

      // Next week
      currentDate = currentDate.add(1, "week");
    }

    const { data, error } = await supabase.from("weights").insert(weights);
    if (error) throw error;
    console.log(`Inserted ${weights.length} monthly weights:`, data);
  } catch (err) {
    console.error("Error seeding monthly weights:", err);
  }
}

seedMonthlyWeights();
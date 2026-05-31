import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.POSTGREST_API_URL || "http://127.0.0.1:3000";
const API_KEY = process.env.POSTGREST_API_KEY || "";

const MEAL_TEMPLATE = [
  { meal: "Breakfast", category: "carb_base" },
  { meal: "Breakfast", category: "beverage" },
  { meal: "Lunch", category: "main" },
  { meal: "Lunch", category: "side" },
  { meal: "Dinner", category: "main" },
  { meal: "Dinner", category: "carb_base" },
  { meal: "Dinner", category: "side" },
];

const SUPPLEMENT_ONLY_ULS = ["Magnesium", "Folate", "Vitamin B3", "Vitamin E (total)"];

function generateRandomGenome(catalog: any, age: number, templateSlots: any[], unmatchedLocked: any[]) {
  const genome = [...templateSlots];
  for (let i = 0; i < genome.length; i++) {
    if (genome[i] === null) {
      const slot = MEAL_TEMPLATE[i];
      const cat = slot.category;
      let validFoods = catalog[cat] || [];

      if (validFoods.length > 0) {
        if (slot.meal === "Dinner" || slot.meal === "Lunch") {
          validFoods = validFoods.filter(
            (f: any) =>
              !f.name.toLowerCase().includes("cereal") &&
              !f.name.toLowerCase().includes("muesli")
          );
        }
        if (slot.meal === "Breakfast") {
          validFoods = validFoods.filter(
            (f: any) =>
              !f.name.toLowerCase().includes("flour") &&
              !f.name.toLowerCase().includes("potato")
          );
        }

        if (age !== undefined) {
          if (age < 1) {
            validFoods = validFoods.filter((f: any) => f.target_age_group === "infant" || f.target_age_group === "all");
          } else if (age < 12) {
            validFoods = validFoods.filter((f: any) => f.target_age_group === "child" || f.target_age_group === "all");
          } else {
            validFoods = validFoods.filter((f: any) => f.target_age_group === "adult" || f.target_age_group === "all");
          }
        }
      }

      if (validFoods.length > 0) {
        const randomFood = validFoods[Math.floor(Math.random() * validFoods.length)];
        genome[i] = { ...randomFood, meal_type: slot.meal };
      } else {
        const keys = Object.keys(catalog);
        const randomCat = catalog[keys[Math.floor(Math.random() * keys.length)]];
        const randomFood = randomCat[Math.floor(Math.random() * randomCat.length)];
        genome[i] = { ...randomFood, meal_type: slot.meal };
      }
    }
  }
  return [...genome, ...unmatchedLocked];
}

function mutate(genome: any[], catalog: any, age: number, freeIndices: number[]) {
  if (freeIndices.length === 0) return genome;
  const newGenome = [...genome];
  const mutateIdx = freeIndices[Math.floor(Math.random() * freeIndices.length)];
  const slot = MEAL_TEMPLATE[mutateIdx];
  const cat = slot.category;

  let validFoods = catalog[cat] || [];
  if (validFoods.length > 0) {
    if (age !== undefined) {
      if (age < 1) {
        validFoods = validFoods.filter((f: any) => f.target_age_group === "infant" || f.target_age_group === "all");
      } else if (age < 12) {
        validFoods = validFoods.filter((f: any) => f.target_age_group === "child" || f.target_age_group === "all");
      } else {
        validFoods = validFoods.filter((f: any) => f.target_age_group === "adult" || f.target_age_group === "all");
      }
    }
  }

  if (validFoods.length > 0) {
    const randomFood = validFoods[Math.floor(Math.random() * validFoods.length)];
    newGenome[mutateIdx] = { ...randomFood, meal_type: slot.meal };
  }
  return newGenome;
}

function evaluateFitnessInMemory(genome: any[], targets: any, matrix: any) {
  const consumed: Record<string, number> = {};
  for (const food of genome) {
    const foodId = food.id;
    const amount = food.serving_size_g;
    if (matrix[foodId]) {
      for (const nutName in matrix[foodId]) {
        const valPer100g = matrix[foodId][nutName];
        consumed[nutName] = (consumed[nutName] || 0) + valPer100g * (amount / 100.0);
      }
    }
  }

  let score = 0;
  for (const nutName in targets) {
    const tData = targets[nutName];
    let cons = consumed[nutName] || 0;

    if (nutName === "Energy") {
      cons = cons / 4.184;
    }

    const targetVal = tData.target;
    const maxVal = tData.max;

    if (targetVal === 0 && maxVal === null) {
      continue;
    }

    const pct = targetVal > 0 ? (cons / targetVal) * 100 : 0;

    if (maxVal !== null && cons > maxVal) {
      if (!SUPPLEMENT_ONLY_ULS.includes(nutName)) {
        score -= 1000;
      }
    }

    if (targetVal > 0) {
      if (pct >= 90 && pct <= 110) {
        score += 10;
      } else if (pct > 110) {
        score += 5;
      } else if (pct >= 50) {
        score += 2;
      } else {
        score -= 5;
      }
    }

    if (nutName === "Energy" && targetVal > 0) {
      if (pct < 85) score -= 50;
      else if (pct > 115) score -= 100;
    }
  }
  return score;
}

// In-memory cache for GA data across warm invocations
let cachedRawCatalog: any = null;
let cachedCatalog: any = null;
let cachedMatrix: any = null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let p_pal = 1.6;
    if (body.activity_level === "sedentary") p_pal = 1.4;
    else if (body.activity_level === "low") p_pal = 1.6;
    else if (body.activity_level === "moderate") p_pal = 1.8;
    else if (body.activity_level === "high") p_pal = 2.0;
    else if (body.activity_level === "very_high") p_pal = 2.2;

    const headers: HeadersInit = { Accept: "application/json" };
    if (API_KEY) headers["apikey"] = headers["Authorization"] = `Bearer ${API_KEY}`;

    // 1. Fetch GA Data (Catalog + Matrix) using cache if available
    let rawCatalog = cachedRawCatalog;
    let catalog = cachedCatalog;
    let matrix = cachedMatrix;

    if (!catalog || !matrix || !rawCatalog) {
      console.log("Fetching GA Data from:", `${API_BASE_URL}/rpc/get_ga_data`);
      const gaDataRes = await fetch(`${API_BASE_URL}/rpc/get_ga_data`, { headers });
      if (!gaDataRes.ok) {
        const errorText = await gaDataRes.text();
        console.error("Fetch failed!", gaDataRes.status, errorText);
        throw new Error(`Failed to fetch GA data: ${gaDataRes.status} from ${API_BASE_URL}`);
      }
      const data = await gaDataRes.json();
      rawCatalog = data.catalog;
      matrix = data.matrix;

      // Group catalog by category
      catalog = {};
      for (const item of rawCatalog) {
        if (!catalog[item.ranking_category]) catalog[item.ranking_category] = [];
        catalog[item.ranking_category].push(item);
      }

      cachedRawCatalog = rawCatalog;
      cachedCatalog = catalog;
      cachedMatrix = matrix;
    }

    // 2. Fetch Targets (Lightweight approach)
    const targetPayload = {
      p_age_years: body.age,
      p_sex: body.sex === "male" ? "Male" : body.sex === "female" ? "Female" : body.sex,
      p_pal: p_pal,
      p_body_weight_kg: body.weight_kg,
    };

    const targetRes = await fetch(`${API_BASE_URL}/rpc/get_user_targets`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(targetPayload),
    });

    if (!targetRes.ok) {
      const errorText = await targetRes.text();
      console.error("Target Fetch failed!", targetRes.status, errorText);
      throw new Error(`Failed to fetch targets: ${targetRes.status} from ${API_BASE_URL}`);
    }
    const targetData = await targetRes.json();

    const targets: any = {};
    for (const row of targetData) {
      targets[row.nutrient_name] = {
        target: row.target_value || 0,
        max: row.max_value || null,
      };
    }

    // 3. Run Genetic Algorithm
    const POPULATION_SIZE = 100;
    const GENERATIONS = 50;
    
    const lockedItems = (body.locked_items || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      ranking_category: i.ranking_category,
      serving_size_g: i.serving_size_g,
      meal_type: i.meal_type
    }));

    const templateSlots: any[] = [];
    const freeIndices: number[] = [];
    const unmatchedLocked = [...lockedItems];

    for (let i = 0; i < MEAL_TEMPLATE.length; i++) {
      const slot = MEAL_TEMPLATE[i];
      const matchIdx = unmatchedLocked.findIndex(l => l.meal_type === slot.meal);
      if (matchIdx !== -1) {
        templateSlots.push(unmatchedLocked[matchIdx]);
        unmatchedLocked.splice(matchIdx, 1);
      } else {
        templateSlots.push(null);
        freeIndices.push(i);
      }
    }

    let population = Array.from({ length: POPULATION_SIZE }, () =>
      generateRandomGenome(catalog, body.age, templateSlots, unmatchedLocked)
    );

    let bestGenome: any = null;
    let bestScore = -99999;

    for (let gen = 0; gen < GENERATIONS; gen++) {
      const scoredPopulation = population.map((ind) => {
        const score = evaluateFitnessInMemory(ind, targets, matrix);
        return { score, genome: ind };
      });

      scoredPopulation.sort((a, b) => b.score - a.score);

      if (scoredPopulation[0].score > bestScore) {
        bestScore = scoredPopulation[0].score;
        bestGenome = scoredPopulation[0].genome;
      }

      const survivors = scoredPopulation
        .slice(0, Math.floor(POPULATION_SIZE * 0.2))
        .map((x) => x.genome);

      const newPopulation = [...survivors];
      while (newPopulation.length < POPULATION_SIZE) {
        const parent = survivors[Math.floor(Math.random() * survivors.length)];
        newPopulation.push(mutate(parent, catalog, body.age, freeIndices));
      }
      population = newPopulation;
    }

    // Convert genome format to MealItem[]
    const mealItems = bestGenome.map((f: any) => ({
      food_id: f.id,
      food_name: f.name,
      food_category: f.ranking_category,
      grams: f.serving_size_g,
      meal_type: f.meal_type,
      is_locked: lockedItems.some((locked: any) => locked.id === f.id && locked.meal_type === f.meal_type)
    }));

    // Deduplicate (combine grams for identical items in the same meal type)
    const mergedItems: any[] = [];
    for (const item of mealItems) {
      const existing = mergedItems.find((i) => i.food_id === item.food_id && i.meal_type === item.meal_type);
      if (existing) existing.grams += item.grams;
      else mergedItems.push(item);
    }

    return NextResponse.json({ items: mergedItems });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

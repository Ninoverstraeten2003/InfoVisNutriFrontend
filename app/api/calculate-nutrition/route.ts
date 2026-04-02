import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.POSTGREST_API_URL || "http://127.0.0.1:3000";
const API_KEY = process.env.POSTGREST_API_KEY || "";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Map activity_level to a numeric PAL (Physical Activity Level)
  let p_pal = 1.6; // default moderate
  if (body.activity_level === "sedentary") p_pal = 1.4;
  else if (body.activity_level === "low") p_pal = 1.6;
  else if (body.activity_level === "moderate") p_pal = 1.8;
  else if (body.activity_level === "high") p_pal = 2.0;
  else if (body.activity_level === "very_high") p_pal = 2.2;

  const postgrestPayload = {
    p_food_items: body.meal_items.map((item: any) => ({
      food_id: item.food_id,
      amount_g: item.grams,
    })),
    p_age_years: body.age,
    p_sex: body.sex === "male" ? "Male" : body.sex === "female" ? "Female" : body.sex,
    p_body_weight_kg: body.weight_kg,
    p_pal: p_pal,
  };

  const url = `${API_BASE_URL}/rpc/calculate_meal_nutrition`;

  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (API_KEY) {
    headers["apikey"] = API_KEY;
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(postgrestPayload),
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Upstream error: ${res.status}`, detail: text },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to calculate nutrition", detail: String(err) },
      { status: 500 }
    );
  }
}

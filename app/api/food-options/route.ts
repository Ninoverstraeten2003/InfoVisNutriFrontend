import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.POSTGREST_API_URL || "http://127.0.0.1:3000";
const API_KEY = process.env.POSTGREST_API_KEY || "";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  const url = new URL(`${API_BASE_URL}/food_options`);
  if (query) {
    url.searchParams.set("food_name", `ilike.*${query}*`);
  }
  url.searchParams.set("limit", "30");
  url.searchParams.set("order", "food_name.asc");

  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (API_KEY) {
    headers["apikey"] = API_KEY;
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }

  try {
    const res = await fetch(url.toString(), { headers });
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
      { error: "Failed to fetch food options", detail: String(err) },
      { status: 500 }
    );
  }
}

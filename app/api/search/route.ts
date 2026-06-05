import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query, limit = 5 } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing or invalid query" }, { status: 400 });
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const postgrestUrl = process.env.POSTGREST_API_URL;

    if (!openrouterKey || !postgrestUrl) {
      console.error("Missing environment variables: OPENROUTER_API_KEY or POSTGREST_API_URL");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // 1. Get embedding from OpenRouter
    const embedRes = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: [query],
      }),
    });

    if (!embedRes.ok) {
      const errorText = await embedRes.text();
      console.error("OpenRouter Embedding Error:", errorText);
      return NextResponse.json({ error: "Failed to generate embedding" }, { status: 502 });
    }

    const embedData = await embedRes.json();
    const vectorArrayFromOpenRouter = embedData.data[0].embedding;

    // 2. Match generic foods in PostgREST using pgvector
    const matchRes = await fetch(`${postgrestUrl}/rpc/match_foods`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query_embedding: vectorArrayFromOpenRouter,
        match_limit: limit,
      }),
    });

    if (!matchRes.ok) {
      const errorText = await matchRes.text();
      console.error("PostgREST match_foods Error:", errorText);
      return NextResponse.json({ error: "Failed to match foods in database" }, { status: 502 });
    }

    const topMatches = await matchRes.json();

    return NextResponse.json({ results: topMatches });

  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

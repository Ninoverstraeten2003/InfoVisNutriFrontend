# NutriVerse PostgREST Frontend

This app is a Next.js frontend for the NutriVerse PostgREST RPC endpoints.
It includes a single-page API explorer with endpoint forms and JSON output panes for:

- Viz 1: `viz1_graph_edges`, `viz1_degree_summary`, `viz1_food_anchors`, `viz1_option_nutrients`
- Viz 2: `viz2_top_foods`, `viz2_food_panel`, `viz2_support_cluster`, `viz2_conflict_aware`, `viz2_curated_rank`

It also includes a visual layer (network map, ranked bars, and compact tables) that is driven directly by these RPC responses.

## 1) Prepare DB API Objects

```bash
psql nutriverse -f db/postgrest_api.sql
```

## 2) Start PostgREST

```bash
postgrest postgrest.conf
```

By default this exposes:

```text
http://127.0.0.1:3000
```

## 3) Configure Frontend Base URL

Create `.env.local` with:

```bash
NEXT_PUBLIC_POSTGREST_URL=http://127.0.0.1:3000
```

If you skip this, the UI defaults to `http://127.0.0.1:3000`.

## 4) Run Frontend

```bash
pnpm install
pnpm dev
```

Open:

```text
http://localhost:3001
```

In the UI, click **Load sample visuals** to fetch all endpoints with default parameters and populate the dashboard in one action.

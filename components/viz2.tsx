import { IconChartBar } from "@tabler/icons-react"
import { HorizontalBars } from "./viz2/bars"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { VisualData } from "../lib/types"
import { asRows, toRankedItems } from "@/lib/utils"
import { ConflictAwareVisual } from "./viz2/conflictAwareVisual"
import { SupportClusterVisual } from "./viz2/supportVisualCluster"
import { FoodPanelBars } from "./viz2/foodPanelBars"
import { CompactTable } from "./viz2/compactTable"

export function Viz2Visualizations({ data }: { data: Pick<VisualData, "viz2TopFoods" | "viz2FoodPanel" | "viz2SupportCluster" | "viz2ConflictAware" | "viz2CuratedRank"> }) {
  const topFoodsItems = toRankedItems(
    asRows(data.viz2TopFoods),
    ["food_name", "name", "food"],
    ["pct_drv_per_100g", "food_value_per_100g", "score", "value"],
    12
  )

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <IconChartBar />
        <h2 className="font-mono text-sm font-semibold tracking-wide uppercase">Visual Layer · Viz 2</h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Perfect Plate Ranking</CardTitle>
            <CardDescription>Top foods from `viz2_top_foods`.</CardDescription>
            <CardAction>Card Action</CardAction>
          </CardHeader>
          <CardContent>
             <HorizontalBars items={topFoodsItems} valueSuffix="%" />
          </CardContent>
          <CardFooter>
            <p>Card Footer</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Food Panel</CardTitle>
            <CardDescription>Nutrient makeup bars from `viz2_food_panel`.</CardDescription>
            <CardAction>Card Action</CardAction>
          </CardHeader>
          <CardContent>
             <FoodPanelBars value={data.viz2FoodPanel} />
          </CardContent>
          <CardFooter>
            <p>Card Footer</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support Cluster</CardTitle>
            <CardDescription>Companion nutrients from `viz2_support_cluster`.</CardDescription>
            <CardAction>Card Action</CardAction>
          </CardHeader>
          <CardContent>
             <SupportClusterVisual value={data.viz2SupportCluster} />
          </CardContent>
          <CardFooter>
            <p>Card Footer</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conflict-Aware Candidates</CardTitle>
            <CardDescription>Top rows from `viz2_conflict_aware`.</CardDescription>
            <CardAction>Card Action</CardAction>
          </CardHeader>
          <CardContent>
             <ConflictAwareVisual value={data.viz2ConflictAware} />
          </CardContent>
          <CardFooter>
            <p>Card Footer</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Curated Rank</CardTitle>
            <CardDescription>Top rows from `viz2_curated_rank`.</CardDescription>
            <CardAction>Card Action</CardAction>
          </CardHeader>
          <CardContent>
             <CompactTable value={data.viz2CuratedRank} />
          </CardContent>
          <CardFooter>
            <p>Card Footer</p>
          </CardFooter>
        </Card>
      </div>
    </section>
  )
}
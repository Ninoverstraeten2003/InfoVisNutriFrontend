"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Demographics } from "@/lib/types";

interface DemographicsFormProps {
  value: Demographics;
  onChange: (value: Demographics) => void;
}

const ACTIVITY_LEVELS: { value: Demographics["activity_level"]; label: string; description: string }[] = [
  { value: "sedentary", label: "Sedentary", description: "Little to no exercise" },
  { value: "low", label: "Low Active", description: "Light exercise 1–3 days/week" },
  { value: "moderate", label: "Moderate", description: "Moderate exercise 3–5 days/week" },
  { value: "high", label: "High Active", description: "Hard exercise 6–7 days/week" },
  { value: "very_high", label: "Very High", description: "Intense daily training" },
];

export function DemographicsForm({ value, onChange }: DemographicsFormProps) {
  const update = <K extends keyof Demographics>(key: K, val: Demographics[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="age" className="text-sm font-medium text-foreground">
          Age
        </Label>
        <div className="relative">
          <Input
            id="age"
            type="number"
            min={1}
            max={120}
            value={value.age}
            onChange={(e) =>
              update("age", Math.max(1, parseInt(e.target.value) || 1))
            }
            className="pr-10 bg-card border-border focus-visible:ring-primary"
            aria-label="Age in years"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            yrs
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="weight" className="text-sm font-medium text-foreground">
          Weight
        </Label>
        <div className="relative">
          <Input
            id="weight"
            type="number"
            min={10}
            max={500}
            step={0.5}
            value={value.weight_kg}
            onChange={(e) =>
              update(
                "weight_kg",
                Math.max(10, parseFloat(e.target.value) || 10)
              )
            }
            className="pr-8 bg-card border-border focus-visible:ring-primary"
            aria-label="Weight in kilograms"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            kg
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sex" className="text-sm font-medium text-foreground">
          Sex
        </Label>
        <Select
          value={value.sex}
          onValueChange={(v) => update("sex", v as Demographics["sex"])}
        >
          <SelectTrigger
            id="sex"
            className="bg-card border-border focus:ring-primary"
            aria-label="Biological sex"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 col-span-2">
        <Label
          htmlFor="activity"
          className="text-sm font-medium text-foreground"
        >
          Activity Level
        </Label>
        <Select
          value={value.activity_level}
          onValueChange={(v) =>
            update("activity_level", v as Demographics["activity_level"])
          }
        >
          <SelectTrigger
            id="activity"
            className="bg-card border-border focus:ring-primary"
            aria-label="Activity level"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                <span className="font-medium">{level.label}</span>
                <span className="text-muted-foreground text-xs ml-1.5">
                  — {level.description}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [localAge, setLocalAge] = useState(value.age.toString());
  const [localWeight, setLocalWeight] = useState(value.weight_kg.toString());

  useEffect(() => {
    setLocalAge(value.age.toString());
  }, [value.age]);

  useEffect(() => {
    setLocalWeight(value.weight_kg.toString());
  }, [value.weight_kg]);

  const update = <K extends keyof Demographics>(key: K, val: Demographics[K]) =>
    onChange({ ...value, [key]: val });

  const handleAgeChange = (val: string) => {
    setLocalAge(val);
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed > 0) update("age", parsed);
  };

  const handleWeightChange = (val: string) => {
    setLocalWeight(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) update("weight_kg", parsed);
  };

  const stepAge = (step: number) => {
    const next = Math.max(1, value.age + step);
    update("age", next);
  };

  const stepWeight = (step: number) => {
    const next = Math.max(10, value.weight_kg + step);
    update("weight_kg", next);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="age" className="text-sm font-medium text-foreground">
          Age (yrs)
        </Label>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => stepAge(-1)}>
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            id="age"
            type="number"
            min={1}
            max={120}
            value={localAge}
            onChange={(e) => handleAgeChange(e.target.value)}
            onBlur={() => setLocalAge(value.age.toString())}
            className="bg-card text-center border-border focus-visible:ring-primary px-1"
            aria-label="Age in years"
          />
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => stepAge(1)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="weight" className="text-sm font-medium text-foreground">
          Weight (kg)
        </Label>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => stepWeight(-1)}>
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            id="weight"
            type="number"
            min={10}
            max={500}
            step={0.5}
            value={localWeight}
            onChange={(e) => handleWeightChange(e.target.value)}
            onBlur={() => setLocalWeight(value.weight_kg.toString())}
            className="bg-card text-center border-border focus-visible:ring-primary px-1"
            aria-label="Weight in kilograms"
          />
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => stepWeight(1)}>
            <Plus className="h-4 w-4" />
          </Button>
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

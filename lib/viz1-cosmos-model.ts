export type NutrientFamily = "vitamin" | "mineral" | "amino" | "fatty" | "other" | "macronutrient"

export interface Food {
  id: string;
  name: string;
  rawValue: number;  // The actual mg/g/mcg
  unit: string;             // The unit of the raw value
  pctDrv: number;    // Percentage of Daily Recommended Value
  score: number;     // Tradeoff or arbitrary ranking score
}

export interface NutrientLink {
  targetId: string
  strength: number
  foods: Food[]
}

export interface Nutrient {
  id: string
  name: string
  shortName: string
  family: NutrientFamily
  links: NutrientLink[]
  foods: Food[]
}

export const NUTRIENT_FAMILY_COLORS: Record<NutrientFamily, string> = {
  vitamin: "#4fc3f7",
  mineral: "#80cbc4",
  amino: "#ce93d8",
  fatty: "#ffcc80",
  macronutrient: "#ff9800",
  other: "#a5d6a7",
}

export const NUTRIENT_FAMILY_LABELS: Record<NutrientFamily, string> = {
  vitamin: "Vitamins",
  mineral: "Minerals",
  amino: "Amino Acids",
  fatty: "Fatty Acids",
  macronutrient: "Macronutrients",
  other: "Other",
}

export const FAMILY_HINTS: Array<{ family: NutrientFamily; patterns: RegExp[] }> = [
  { 
    family: "vitamin", 
    patterns: [
      /^vit/i, 
      /folat/i, 
      /folic/i,
      /tocopherol/i, 
      /carotene/i,   
      /retinol/i,    
      /choline/i     
    ] 
  },
  { 
    family: "mineral", 
    patterns: [
      /calcium/i, /copper/i, /iodine/i, /iron/i, /magnesium/i, 
      /manganese/i, /molybdenum/i, /phosphorus/i, /potassium/i, 
      /selenium/i, /sodium/i, /sulfur/i, /chloride/i, /fluoride/i,
      /zinc/i, /salt/i, /ash/i
    ] 
  },
  { 
    family: "amino", 
    patterns: [
      /amino/i, /leucine/i, /isoleucine/i, /valine/i, 
      /tryptophan/i, /glutamine/i
    ] 
  },
  { 
    family: "fatty", 
    patterns: [
      /omega/i, /fatty/i, /\bfa\b/i, /epa/i, /dha/i, 
      /linolenic/i, /arachidonic/i, /butyric/i, /capric/i, 
      /caproic/i, /caprylic/i, /lauric/i, /linoleic/i, 
      /myristic/i, /oleic/i, /palmitic/i, /stearic/i
    ] 
  },
  { 
    family: "macronutrient", 
    patterns: [
      /alcohol/i, /fibre/i, /energy/i, /glucose/i, 
      /protein/i, /carbohydrate/i, /\bfat\b/i,
      /sugar/i, /fructose/i, /galactose/i, /lactose/i, 
      /maltose/i, /sucrose/i, /starch/i, /polyol/i,   
      /cholesterol/i, 
      /water/i        
    ] 
  },
  { 
    family: "other", 
    patterns: [
      /organic acid/i,
      /.*/ // The ultimate catch-all: matches any remaining string
    ] 
  }
];

export function inferNutrientFamily(name: string): NutrientFamily {
  const normalized = name.trim()
  for (const { family, patterns } of FAMILY_HINTS) {
    if (patterns.some((pattern) => pattern.test(normalized))) {
      return family
    }
  }
  return "other"
}

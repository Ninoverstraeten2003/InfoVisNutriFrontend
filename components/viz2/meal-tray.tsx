import { useState, useEffect } from "react";
import { Trash2, UtensilsCrossed, Minus, Plus, GripVertical, Lock, Unlock } from "lucide-react";
import { DndContext, useDraggable, useDroppable, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor, KeyboardSensor, closestCenter } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { MealItem } from "@/lib/types";

interface MealTrayProps {
  items: MealItem[];
  onRemove: (food_id: number, meal_type?: string) => void;
  onUpdateGrams: (food_id: number, grams: number, meal_type?: string) => void;
  onUpdateMealType?: (food_id: number, oldMealType: string | undefined, newMealType: string) => void;
  onToggleLock?: (food_id: number, meal_type?: string) => void;
  onHover?: (food_id: number | null) => void;
  hoveredFoodId?: number | null;
}

function MealTrayItem({ item, onRemove, onUpdateGrams, onToggleLock, onHover, isHovered }: { item: MealItem; onRemove: (id: number, mt?: string) => void; onUpdateGrams: (id: number, g: number, mt?: string) => void; onToggleLock?: (id: number, mt?: string) => void; onHover?: (id: number | null) => void; isHovered?: boolean }) {
  const [localGrams, setLocalGrams] = useState(item.grams.toString());

  const id = `${item.food_id}-${item.meal_type || "none"}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { food_id: item.food_id, meal_type: item.meal_type },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

  useEffect(() => {
    setLocalGrams(item.grams.toString());
  }, [item.grams]);

  const handleChange = (val: string) => {
    setLocalGrams(val);
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateGrams(item.food_id, parsed, item.meal_type);
    }
  };

  const stepGrams = (step: number) => {
    const next = Math.max(1, item.grams + step);
    onUpdateGrams(item.food_id, next, item.meal_type);
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-2 rounded-lg border bg-card p-3 group transition-all duration-200 cursor-pointer ${isHovered ? 'border-primary bg-primary/[0.03] shadow-sm' : 'border-border hover:border-primary/30'} ${isDragging ? 'opacity-50 scale-[1.02] shadow-xl' : ''}`}
      onClick={() => onHover?.(isHovered ? null : item.food_id)}
    >
      <div className="flex items-start gap-2">
        <div 
          {...listeners} 
          {...attributes} 
          className="mt-0.5 shrink-0 cursor-grab touch-none opacity-40 hover:opacity-100 transition-opacity" 
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">
            {item.food_name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">

            <Badge
              variant="secondary"
              className="text-[10px] font-normal px-1.5 py-0"
            >
              {item.food_category}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${item.is_locked ? 'text-primary opacity-100' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={(e) => { e.stopPropagation(); onToggleLock?.(item.food_id, item.meal_type); }}
            aria-label={item.is_locked ? `Unlock ${item.food_name}` : `Lock ${item.food_name}`}
          >
            {item.is_locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => { e.stopPropagation(); onRemove(item.food_id, item.meal_type); }}
            aria-label={`Remove ${item.food_name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/50 pt-2.5 mt-1">
        <span className="text-xs text-muted-foreground">Portion size</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); stepGrams(-10); }}>
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Input
              type="number"
              min={1}
              max={9999}
              value={localGrams}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={() => setLocalGrams(item.grams.toString())}
              className="w-20 h-8 text-sm text-center pr-5 bg-background border-border focus-visible:ring-primary"
              aria-label={`Grams of ${item.food_name}`}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              g
            </span>
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); stepGrams(10); }}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MealGroup({ mealType, children }: { mealType: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: mealType,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`space-y-3 p-2 -mx-2 rounded-xl transition-colors duration-200 ${isOver ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}
    >
      <div className="flex items-center gap-3 px-1">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">{mealType}</h3>
        <div className="h-px flex-1 bg-border/60" />
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

export function MealTray({ items, onRemove, onUpdateGrams, onUpdateMealType, onToggleLock, onHover, hoveredFoodId }: MealTrayProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
        <UtensilsCrossed className="h-10 w-10 opacity-30" />
        <p className="text-sm text-balance text-center">
          Your meal tray is empty. Search for foods above to add them.
        </p>
      </div>
    );
  }

  const totalGrams = items.reduce((sum, item) => sum + item.grams, 0);

  // Group items by meal_type
  const mealOrder = ["Breakfast", "Lunch", "Dinner", "Snack"];
  const groupedItems = items.reduce((acc, item) => {
    const meal = item.meal_type || "Other";
    if (!acc[meal]) acc[meal] = [];
    acc[meal].push(item);
    return acc;
  }, {} as Record<string, MealItem[]>);

  // Sort groups by predefined order
  const sortedGroups = Object.entries(groupedItems).sort(([mealA], [mealB]) => {
    const idxA = mealOrder.indexOf(mealA);
    const idxB = mealOrder.indexOf(mealB);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return mealA.localeCompare(mealB);
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeData = active.data.current;
    const newMealType = over.id as string;

    if (activeData && activeData.meal_type !== newMealType) {
      onUpdateMealType?.(activeData.food_id, activeData.meal_type, newMealType);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {sortedGroups.map(([mealType, mealItems]) => (
          <MealGroup key={mealType} mealType={mealType}>
            {mealItems.map((item) => (
              <MealTrayItem key={`${item.food_id}-${item.meal_type || "none"}`} item={item} onRemove={onRemove} onUpdateGrams={onUpdateGrams} onToggleLock={onToggleLock} onHover={onHover} isHovered={hoveredFoodId === item.food_id} />
            ))}
          </MealGroup>
        ))}

        <div className="flex items-center justify-between pt-1 px-1">
          <span className="text-xs text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
          <span className="text-xs font-medium text-foreground">
            {totalGrams}g total
          </span>
        </div>
      </div>
    </DndContext>
  );
}

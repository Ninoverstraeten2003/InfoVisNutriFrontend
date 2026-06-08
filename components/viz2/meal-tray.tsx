import { useState, useEffect } from "react";
import { Trash2, UtensilsCrossed, Minus, Plus, GripVertical, Lock, Unlock } from "lucide-react";
import { DndContext, useDraggable, useDroppable, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor, KeyboardSensor, closestCenter } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
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

const getShorthand = (cat: string) => {
  const l = cat.toLowerCase();
  if (l.includes('carb')) return 'CARB';
  if (l.includes('protein')) return 'PRO';
  if (l.includes('beverage')) return 'BEV';
  if (l.includes('dairy')) return 'DAI';
  if (l.includes('fruit')) return 'FRU';
  if (l.includes('snack')) return 'SNK';
  if (l.includes('soup')) return 'SOUP';
  if (l.includes('composite')) return 'COMP';
  if (l === 'main') return 'MAIN';
  if (l === 'side') return 'SIDE';
  return cat.substring(0, 4).toUpperCase();
};

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
      className={`flex items-center gap-1 sm:gap-2 rounded-md border bg-card p-1.5 pl-1 group transition-all duration-200 cursor-pointer ${isHovered ? 'border-primary bg-primary/[0.03] shadow-sm' : 'border-border hover:border-primary/30'} ${isDragging ? 'opacity-50 scale-[1.02] shadow-xl' : ''}`}
      onClick={() => onHover?.(isHovered ? null : item.food_id)}
    >
      <div 
        {...listeners} 
        {...attributes} 
        className="shrink-0 cursor-grab touch-none opacity-20 hover:opacity-100 transition-opacity p-0.5 sm:p-1" 
        onClick={e => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      
      {/* Title + Tag */}
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2 pr-1">
        <p className="text-sm font-medium text-foreground truncate" title={item.food_name}>
          {item.food_name}
        </p>
        
        {/* Simple Tag (Shorthand) */}
        <span 
          className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground bg-accent px-1.5 py-0.5 rounded-sm" 
          title={item.food_category}
        >
          {getShorthand(item.food_category)}
        </span>
      </div>

      {/* Inputs (inline) */}
      <div className="flex items-center shrink-0" onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-muted-foreground" onClick={(e) => { e.stopPropagation(); stepGrams(-10); }}>
          <Minus className="h-2.5 w-2.5" />
        </Button>
        <div className="relative w-10 sm:w-11">
          <Input
            type="number"
            min={1}
            max={9999}
            value={localGrams}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => setLocalGrams(item.grams.toString())}
            className="w-full h-5 text-xs text-center px-0.5 pr-2.5 bg-background border-border focus-visible:ring-primary shadow-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label={`Grams of ${item.food_name}`}
          />
          <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground pointer-events-none">
            g
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-muted-foreground" onClick={(e) => { e.stopPropagation(); stepGrams(10); }}>
          <Plus className="h-2.5 w-2.5" />
        </Button>
      </div>

      {/* Actions (Always visible, slightly dimmed) */}
      <div className="flex items-center shrink-0 opacity-60 hover:opacity-100 group-hover:opacity-100 transition-opacity w-[40px] justify-end">
        <Button
          variant="ghost"
          size="sm"
          className={`h-5 w-5 p-0 ${item.is_locked ? 'text-primary opacity-100' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={(e) => { e.stopPropagation(); onToggleLock?.(item.food_id, item.meal_type); }}
          aria-label={item.is_locked ? `Unlock ${item.food_name}` : `Lock ${item.food_name}`}
        >
          {item.is_locked ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => { e.stopPropagation(); onRemove(item.food_id, item.meal_type); }}
          aria-label={`Remove ${item.food_name}`}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
    </div>
  );
}

function MealGroup({ mealType, items, children }: { mealType: string; items: MealItem[]; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: mealType,
  });

  const totalGrams = items.reduce((sum, item) => sum + item.grams, 0);

  return (
    <AccordionItem value={mealType} className="border-b-0">
      <div 
        ref={setNodeRef} 
        className={`rounded-lg transition-colors duration-200 ${isOver ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}
      >
        <AccordionTrigger className="hover:no-underline py-2 px-1">
          <div className="flex items-center justify-between w-full pr-2">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">{mealType}</h3>
            <span className="text-xs text-muted-foreground font-normal">
              {items.length} items · {totalGrams}g
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-1.5 pb-2">
            {children}
          </div>
        </AccordionContent>
      </div>
    </AccordionItem>
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
        <Accordion type="multiple" defaultValue={sortedGroups.map(([m]) => m)} className="space-y-1">
          {sortedGroups.map(([mealType, mealItems]) => (
            <MealGroup key={mealType} mealType={mealType} items={mealItems}>
              {mealItems.map((item) => (
                <MealTrayItem key={`${item.food_id}-${item.meal_type || "none"}`} item={item} onRemove={onRemove} onUpdateGrams={onUpdateGrams} onToggleLock={onToggleLock} onHover={onHover} isHovered={hoveredFoodId === item.food_id} />
              ))}
            </MealGroup>
          ))}
        </Accordion>

        <div className="flex items-center justify-between pt-3 px-1 mt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
          <span className="text-xs font-medium text-foreground">
            {totalGrams}g total
          </span>
        </div>
    </DndContext>
  );
}

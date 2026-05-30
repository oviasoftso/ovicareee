import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, FlaskConical } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Ingredient {
  name: string;
  amountPerUnit: string;
  unit: string;
}

const UNITS = ["mg", "g", "mL", "mcg", "IU", "%"];

export function CompoundCalculator({ open, onOpenChange }: Props) {
  const [targetQuantity, setTargetQuantity] = useState("");
  const [targetUnit, setTargetUnit] = useState("mg");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", amountPerUnit: "", unit: "mg" },
  ]);

  const addIngredient = () => setIngredients([...ingredients, { name: "", amountPerUnit: "", unit: "mg" }]);
  const removeIngredient = (i: number) => setIngredients(ingredients.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, field: keyof Ingredient, value: string) => {
    const next = [...ingredients];
    next[i] = { ...next[i], [field]: value };
    setIngredients(next);
  };

  const targetNum = Number(targetQuantity);
  const validIngredients = ingredients.filter((i) => i.name && Number(i.amountPerUnit) > 0);

  const calculations = validIngredients.map((ing) => {
    const amountPer = Number(ing.amountPerUnit);
    const totalNeeded = amountPer * targetNum;
    return {
      name: ing.name,
      amountPerUnit: amountPer,
      unit: ing.unit,
      totalNeeded,
      percentage: targetNum > 0 ? ((totalNeeded / targetNum) * 100).toFixed(2) : "0",
    };
  });

  const totalWeight = calculations.reduce((a, c) => a + c.totalNeeded, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5" /> Compound Medication Mixer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Target Quantity per Unit</Label>
              <Input type="number" value={targetQuantity} onChange={(e) => setTargetQuantity(e.target.value)} placeholder="1000" />
            </div>
            <div>
              <Label>Unit</Label>
              <select value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Ingredients</Label>
              <Button type="button" size="sm" variant="outline" onClick={addIngredient}><Plus className="h-3 w-3 mr-1" /> Add</Button>
            </div>
            {ingredients.map((ing, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end mb-2">
                <div className="col-span-5"><Label className="text-xs">Name</Label><Input value={ing.name} onChange={(e) => updateIngredient(i, "name", e.target.value)} placeholder="Ingredient name" /></div>
                <div className="col-span-3"><Label className="text-xs">Amount/Unit</Label><Input type="number" value={ing.amountPerUnit} onChange={(e) => updateIngredient(i, "amountPerUnit", e.target.value)} placeholder="0" /></div>
                <div className="col-span-3">
                  <Label className="text-xs">Unit</Label>
                  <select value={ing.unit} onChange={(e) => updateIngredient(i, "unit", e.target.value)} className="w-full rounded-md border bg-background px-2 py-2 text-sm">
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  {ingredients.length > 1 && <Button type="button" size="icon" variant="ghost" onClick={() => removeIngredient(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              </div>
            ))}
          </div>

          {validIngredients.length > 0 && targetNum > 0 && (
            <div className="rounded-lg bg-muted/30 p-4 space-y-2">
              <div className="font-display font-semibold text-sm mb-2">Calculation Results (for {targetQuantity} {targetUnit})</div>
              <table className="w-full text-sm">
                <thead className="text-muted-foreground text-xs">
                  <tr><th className="text-left pb-1">Ingredient</th><th className="text-right pb-1">Per Unit</th><th className="text-right pb-1">Total Needed</th><th className="text-right pb-1">%</th></tr>
                </thead>
                <tbody>
                  {calculations.map((c) => (
                    <tr key={c.name} className="border-t">
                      <td className="py-1 font-medium">{c.name}</td>
                      <td className="py-1 text-right font-mono">{c.amountPerUnit} {c.unit}</td>
                      <td className="py-1 text-right font-mono font-bold">{c.totalNeeded.toFixed(2)} {c.unit}</td>
                      <td className="py-1 text-right font-mono text-muted-foreground">{c.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                <span>Total Weight:</span>
                <span className="font-mono">{totalWeight.toFixed(2)} {targetUnit}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

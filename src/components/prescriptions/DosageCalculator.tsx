import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, AlertTriangle, CheckCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string;
  strength?: string;
}

const DOSAGE_GUIDES: Record<
  string,
  { maxDaily: number; unit: string; frequency: string; notes: string }
> = {
  paracetamol: {
    maxDaily: 4000,
    unit: "mg",
    frequency: "Every 4-6 hours",
    notes: "Max 4g/day for adults. Reduce for liver impairment.",
  },
  amoxicillin: {
    maxDaily: 3000,
    unit: "mg",
    frequency: "Every 8 hours",
    notes: "Standard adult: 250-500mg every 8h. Max 3g/day.",
  },
  metformin: {
    maxDaily: 2550,
    unit: "mg",
    frequency: "2-3 times daily",
    notes: "Start 500mg, titrate up. Max 2550mg/day.",
  },
  ibuprofen: {
    maxDaily: 2400,
    unit: "mg",
    frequency: "Every 6-8 hours",
    notes: "OTC max 1200mg. Prescription max 2400mg/day.",
  },
  omeprazole: {
    maxDaily: 40,
    unit: "mg",
    frequency: "Once daily",
    notes: "Standard 20mg once daily. Max 40mg for ZES.",
  },
  lisinopril: {
    maxDaily: 40,
    unit: "mg",
    frequency: "Once daily",
    notes: "Start 10mg. Max 40mg/day.",
  },
  atorvastatin: {
    maxDaily: 80,
    unit: "mg",
    frequency: "Once daily",
    notes: "Standard 10-20mg. Max 80mg for high-risk.",
  },
  amlodipine: {
    maxDaily: 10,
    unit: "mg",
    frequency: "Once daily",
    notes: "Start 5mg. Max 10mg/day.",
  },
  metoprolol: {
    maxDaily: 400,
    unit: "mg",
    frequency: "1-2 times daily",
    notes: "Start 25-50mg. Max 400mg/day.",
  },
  warfarin: {
    maxDaily: 10,
    unit: "mg",
    frequency: "Once daily",
    notes: "Dose adjusted by INR. Highly variable.",
  },
};

export function DosageCalculator({ open, onOpenChange, productName = "", strength = "" }: Props) {
  const [drug, setDrug] = useState(productName.toLowerCase());
  const [patientWeight, setPatientWeight] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [proposedDose, setProposedDose] = useState("");
  const [frequency, setFrequency] = useState("3");

  const guide = DOSAGE_GUIDES[drug.toLowerCase()];
  const doseNum = Number(proposedDose);
  const freqNum = Number(frequency);
  const dailyTotal = doseNum * freqNum;

  const weightBasedMax = patientWeight ? Number(patientWeight) * 15 : null;
  const isOverMax = guide ? dailyTotal > guide.maxDaily : false;
  const isOverWeight = weightBasedMax ? dailyTotal > weightBasedMax : false;
  const isSafe = doseNum > 0 && !isOverMax && !isOverWeight;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" /> Dosage Safety Calculator
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Medication</Label>
            <Select value={drug} onValueChange={setDrug}>
              <SelectTrigger>
                <SelectValue placeholder="Select medication" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(DOSAGE_GUIDES).map((d) => (
                  <SelectItem key={d} value={d} className="capitalize">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Patient Weight (kg)</Label>
              <Input
                type="number"
                value={patientWeight}
                onChange={(e) => setPatientWeight(e.target.value)}
                placeholder="70"
              />
            </div>
            <div>
              <Label>Patient Age (years)</Label>
              <Input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="35"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Proposed Dose ({guide?.unit ?? "mg"})</Label>
              <Input
                type="number"
                value={proposedDose}
                onChange={(e) => setProposedDose(e.target.value)}
                placeholder="500"
              />
            </div>
            <div>
              <Label>Times per Day</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}x daily
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {doseNum > 0 && (
            <div className="rounded-lg bg-muted/30 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Daily Total:</span>
                <span className="font-mono font-bold">
                  {dailyTotal} {guide?.unit ?? "mg"}
                </span>
              </div>
              {guide && (
                <div className="flex justify-between text-sm">
                  <span>Max Daily ({drug}):</span>
                  <span className="font-mono">
                    {guide.maxDaily} {guide.unit}
                  </span>
                </div>
              )}
              {patientWeight && (
                <div className="flex justify-between text-sm">
                  <span>Weight-based max (15mg/kg):</span>
                  <span className="font-mono">
                    {weightBasedMax} {guide?.unit ?? "mg"}
                  </span>
                </div>
              )}

              {isOverMax && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Exceeds maximum daily dose for {drug} ({guide?.maxDaily}
                    {guide?.unit}).
                  </AlertDescription>
                </Alert>
              )}

              {isOverWeight && !isOverMax && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Exceeds weight-based maximum ({weightBasedMax}
                    {guide?.unit} at 15mg/kg).
                  </AlertDescription>
                </Alert>
              )}

              {isSafe && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Dose is within safe limits.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {guide && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
              <div className="font-medium mb-1">Standard dosing for {drug}:</div>
              <div className="text-muted-foreground">
                {guide.frequency} · Max {guide.maxDaily}
                {guide.unit}/day
              </div>
              <div className="text-muted-foreground mt-1">{guide.notes}</div>
            </div>
          )}

          {Number(patientAge) > 0 && Number(patientAge) < 18 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Pediatric patient — always verify weight-based dosing. Standard adult doses may be
                unsafe.
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

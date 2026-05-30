import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: any;
  items: any[];
}

export function LabelGenerator({ open, onOpenChange, prescription, items }: Props) {
  const [copied, setCopied] = useState(false);

  if (!prescription || !items?.length) return null;

  const patientName = prescription.patients?.full_name ?? "Patient";
  const rxNumber = prescription.prescription_number ?? "";

  const labels = items.map((item: any) => {
    const drug = `${item.products?.name ?? "Medication"} ${item.products?.strength ?? ""}`.trim();
    const dosage = item.dosage ?? "As directed";
    const frequency = item.frequency ?? "As needed";
    const duration = item.duration ?? "";
    const qty = item.quantity_prescribed ?? 0;

    return {
      drug,
      patient: patientName,
      rx: rxNumber,
      instructions: `${dosage}, ${frequency}${duration ? `, for ${duration}` : ""}`,
      quantity: `Qty: ${qty}`,
      warnings: [
        item.products?.requires_prescription ? "PRESCRIPTION ONLY" : null,
        "Store in a cool, dry place",
        "Keep out of reach of children",
        "Do not use after expiry date",
      ].filter(Boolean),
    };
  });

  const labelText = labels.map((l) =>
    `${"=".repeat(40)}\n` +
    `  ${l.drug}\n` +
    `  Patient: ${l.patient}\n` +
    `  Rx: ${l.rx}\n` +
    `  ${l.instructions}\n` +
    `  ${l.quantity}\n` +
    l.warnings.map((w) => `  ⚠ ${w}`).join("\n") +
    `\n${"=".repeat(40)}`
  ).join("\n\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(labelText);
    setCopied(true);
    toast.success("Labels copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Prescription Labels</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; }
          .label { border: 2px solid #000; padding: 16px; margin-bottom: 20px; page-break-after: always; }
          .drug { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
          .field { margin: 4px 0; font-size: 14px; }
          .warning { color: #c00; font-weight: bold; margin-top: 8px; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style></head><body>
        ${labels.map((l) => `
          <div class="label">
            <div class="drug">${l.drug}</div>
            <div class="field"><strong>Patient:</strong> ${l.patient}</div>
            <div class="field"><strong>Rx:</strong> ${l.rx}</div>
            <div class="field"><strong>Directions:</strong> ${l.instructions}</div>
            <div class="field"><strong>${l.quantity}</div>
            ${l.warnings.map((w) => `<div class="warning">⚠ ${w}</div>`).join("")}
          </div>
        `).join("")}
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Prescription Labels</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {labels.map((l, i) => (
            <div key={i} className="rounded-lg border-2 border-dashed p-4 font-mono text-sm">
              <div className="font-bold text-base mb-2">{l.drug}</div>
              <div>Patient: {l.patient}</div>
              <div>Rx: {l.rx}</div>
              <div className="mt-1">{l.instructions}</div>
              <div>{l.quantity}</div>
              {l.warnings.map((w, j) => (
                <div key={j} className="text-destructive font-bold text-xs mt-1">⚠ {w}</div>
              ))}
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied" : "Copy Text"}
          </Button>
          <Button onClick={handlePrint} className="gradient-primary text-white">
            <Printer className="h-4 w-4 mr-2" /> Print Labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string;
  patientId: string;
  totalAmount: number;
  onSuccess: () => void;
}

export function InsuranceClaimDialog({ open, onOpenChange, saleId, patientId, totalAmount, onSuccess }: Props) {
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [provider, setProvider] = useState("");
  const [number, setNumber] = useState("");
  const [claimAmount, setClaimAmount] = useState(String(totalAmount));
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!provider || !number) { toast.error("Provider and number required"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("insurance_claims").insert({
        sale_id: saleId,
        patient_id: patientId,
        insurance_provider: provider,
        insurance_number: number,
        claim_amount: Number(claimAmount),
        status: "pending",
        notes,
      });
      if (error) throw error;
      toast.success("Insurance claim submitted");
      qc.invalidateQueries({ queryKey: ["insurance-claims"] });
      onSuccess();
      onOpenChange(false);
      setProvider(""); setNumber(""); setNotes("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insurance Claim</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/30 p-3 text-sm">
            <div className="flex justify-between"><span>Sale Total:</span><span className="font-semibold">${totalAmount.toFixed(2)}</span></div>
          </div>
          <div>
            <Label>Insurance Provider</Label>
            <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. NHIF, Britam, Jubilee" />
          </div>
          <div>
            <Label>Policy / Member Number</Label>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Member number" />
          </div>
          <div>
            <Label>Claim Amount</Label>
            <Input type="number" value={claimAmount} onChange={(e) => setClaimAmount(e.target.value)} />
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="gradient-primary text-white">
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Submit Claim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

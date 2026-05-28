import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RxItem {
  product_id: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
}

export function NewPrescriptionDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [prescriberName, setPrescriberName] = useState("");
  const [prescriberLicense, setPrescriberLicense] = useState("");
  const [prescriberPhone, setPrescriberPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<RxItem[]>([{ product_id: "", dosage: "", frequency: "", duration: "", quantity: "" }]);

  const { data: patients } = useQuery({
    queryKey: ["patients-list"],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("id, full_name, patient_code").order("full_name");
      return data ?? [];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, strength, dosage_form").eq("is_active", true).order("name");
      return data ?? [];
    },
  });

  const addItem = () => setItems([...items, { product_id: "", dosage: "", frequency: "", duration: "", quantity: "" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof RxItem, value: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    setItems(next);
  };

  const handleSubmit = async () => {
    if (!patientId || !prescriberName) { toast.error("Patient and prescriber are required"); return; }
    if (items.some((it) => !it.product_id || !it.quantity)) { toast.error("All items need a product and quantity"); return; }
    setSubmitting(true);
    try {
      const rxNumber = `RX-${Date.now()}`;
      const { data: rx, error: rxErr } = await supabase.from("prescriptions").insert({
        prescription_number: rxNumber,
        patient_id: patientId,
        prescriber_name: prescriberName,
        prescriber_license: prescriberLicense,
        prescriber_phone: prescriberPhone,
        branch_id: profile?.branch_id,
        status: "pending",
        notes,
      }).select().single();
      if (rxErr) throw rxErr;

      const rxItems = items.map((it) => ({
        prescription_id: rx.id,
        product_id: it.product_id,
        dosage: it.dosage,
        frequency: it.frequency,
        duration: it.duration,
        quantity_prescribed: Number(it.quantity),
      }));
      const { error: itemErr } = await supabase.from("prescription_items").insert(rxItems);
      if (itemErr) throw itemErr;

      toast.success(`Prescription ${rxNumber} created`);
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
      onOpenChange(false);
      setPatientId(""); setPrescriberName(""); setPrescriberLicense(""); setPrescriberPhone(""); setNotes("");
      setItems([{ product_id: "", dosage: "", frequency: "", duration: "", quantity: "" }]);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create prescription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Prescription</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Patient</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
              <SelectContent>
                {(patients ?? []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.patient_code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Prescriber Name</Label><Input value={prescriberName} onChange={(e) => setPrescriberName(e.target.value)} placeholder="Dr. name" /></div>
            <div><Label>License No.</Label><Input value={prescriberLicense} onChange={(e) => setPrescriberLicense(e.target.value)} placeholder="License" /></div>
            <div><Label>Phone</Label><Input value={prescriberPhone} onChange={(e) => setPrescriberPhone(e.target.value)} placeholder="Phone" /></div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Medications</Label>
              <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add</Button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end rounded-lg bg-muted/30 p-3">
                <div className="col-span-4">
                  <Label className="text-xs">Product</Label>
                  <Select value={item.product_id} onValueChange={(v) => updateItem(i, "product_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {(products ?? []).map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} {p.strength} ({p.dosage_form})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label className="text-xs">Dosage</Label><Input value={item.dosage} onChange={(e) => updateItem(i, "dosage", e.target.value)} placeholder="e.g. 500mg" /></div>
                <div className="col-span-2"><Label className="text-xs">Frequency</Label><Input value={item.frequency} onChange={(e) => updateItem(i, "frequency", e.target.value)} placeholder="e.g. 3x/day" /></div>
                <div className="col-span-2"><Label className="text-xs">Duration</Label><Input value={item.duration} onChange={(e) => updateItem(i, "duration", e.target.value)} placeholder="e.g. 7 days" /></div>
                <div className="col-span-1"><Label className="text-xs">Qty</Label><Input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} placeholder="0" /></div>
                <div className="col-span-1 flex items-center justify-center">
                  {items.length > 1 && <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              </div>
            ))}
          </div>

          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="gradient-primary text-white">
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Create Prescription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

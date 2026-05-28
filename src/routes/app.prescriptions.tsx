import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader, EmptyState } from "@/components/PageShell";
import { fmtDate } from "@/lib/format";
import { FileText, Plus, ArrowRight, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { NewPrescriptionDialog } from "@/components/prescriptions/NewPrescriptionDialog";

export const Route = createFileRoute("/app/prescriptions")({ component: Prescriptions });

const COLS = ["pending", "verifying", "dispensing", "ready", "completed"] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  verifying: "bg-blue-100 text-blue-800",
  dispensing: "bg-violet-100 text-violet-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
};

const NEXT_STATUS: Record<string, string> = {
  pending: "verifying",
  verifying: "dispensing",
  dispensing: "ready",
  ready: "completed",
};

function Prescriptions() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRx, setSelectedRx] = useState<any>(null);

  const { data } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: async () => {
      const { data } = await supabase.from("prescriptions").select("*, patients(full_name, phone, allergies)").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const { data: rxItems } = useQuery({
    queryKey: ["prescription-items", selectedRx?.id],
    queryFn: async () => {
      if (!selectedRx?.id) return [];
      const { data } = await supabase.from("prescription_items").select("*, products(name, strength, dosage_form, requires_prescription)").eq("prescription_id", selectedRx.id);
      return data ?? [];
    },
    enabled: !!selectedRx?.id,
  });

  const advanceStatus = useMutation({
    mutationFn: async (rx: any) => {
      const next = NEXT_STATUS[rx.status];
      if (!next) return;
      const { error } = await supabase.from("prescriptions").update({ status: next }).eq("id", rx.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
      setSelectedRx(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <PageShell>
      <PageHeader title="Prescriptions" subtitle="Dispensing queue across all branches" action={
        <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-2 rounded-lg gradient-primary text-white font-semibold px-4 py-2.5 text-sm shadow-glow"><Plus className="h-4 w-4" /> New prescription</button>
      } />

      <NewPrescriptionDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {!data?.length ? (
        <EmptyState icon={FileText} title="No prescriptions yet" message="Prescriptions you process will appear in the kanban board." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {COLS.map((status) => (
            <div key={status} className="rounded-xl bg-muted/40 p-3 min-h-[400px]">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground capitalize">{status}</h3>
                <Badge variant="outline" className="text-xs">{(data ?? []).filter((p: any) => p.status === status).length}</Badge>
              </div>
              <div className="space-y-2">
                {(data ?? []).filter((p: any) => p.status === status).map((p: any) => (
                  <div key={p.id} onClick={() => setSelectedRx(p)} className="rounded-lg bg-card border p-3 shadow-card cursor-pointer hover:shadow-glow transition">
                    <div className="text-xs text-mono text-muted-foreground">{p.prescription_number}</div>
                    <div className="font-medium text-sm mt-1">{p.patients?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground mt-1">Dr. {p.prescriber_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{fmtDate(p.issue_date)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={!!selectedRx} onOpenChange={(open) => { if (!open) setSelectedRx(null); }}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          {selectedRx && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedRx.prescription_number}
                  <Badge className={STATUS_COLORS[selectedRx.status] ?? ""}>{selectedRx.status}</Badge>
                </SheetTitle>
                <SheetDescription>Prescription details and dispensing</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Patient:</span><div className="font-medium">{selectedRx.patients?.full_name ?? "—"}</div></div>
                  <div><span className="text-muted-foreground">Phone:</span><div className="font-medium">{selectedRx.patients?.phone ?? "—"}</div></div>
                  <div><span className="text-muted-foreground">Prescriber:</span><div className="font-medium">Dr. {selectedRx.prescriber_name}</div></div>
                  <div><span className="text-muted-foreground">License:</span><div className="font-medium">{selectedRx.prescriber_license ?? "—"}</div></div>
                  <div><span className="text-muted-foreground">Issue Date:</span><div className="font-medium">{fmtDate(selectedRx.issue_date)}</div></div>
                  <div><span className="text-muted-foreground">Expiry:</span><div className="font-medium">{fmtDate(selectedRx.expiry_date)}</div></div>
                </div>

                {selectedRx.patients?.allergies?.length > 0 && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-destructive"><AlertTriangle className="h-4 w-4" /> Allergies</div>
                    <div className="mt-1 text-sm">{selectedRx.patients.allergies.join(", ")}</div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-sm mb-2">Medications</h4>
                  <div className="space-y-2">
                    {(rxItems ?? []).map((item: any) => (
                      <div key={item.id} className="rounded-lg bg-muted/30 p-3 text-sm">
                        <div className="font-medium">{item.products?.name} {item.products?.strength}</div>
                        <div className="text-muted-foreground text-xs mt-1">{item.dosage} · {item.frequency} · {item.duration}</div>
                        <div className="text-xs mt-1">Qty: {item.quantity_prescribed} {item.quantity_dispensed > 0 && `(dispensed: ${item.quantity_dispensed})`}</div>
                      </div>
                    ))}
                    {(!rxItems || rxItems.length === 0) && <div className="text-sm text-muted-foreground">No items</div>}
                  </div>
                </div>

                {selectedRx.notes && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedRx.notes}</p>
                  </div>
                )}

                {NEXT_STATUS[selectedRx.status] && (
                  <Button onClick={() => advanceStatus.mutate(selectedRx)} disabled={advanceStatus.isPending} className="w-full gradient-primary text-white">
                    <ArrowRight className="h-4 w-4 mr-2" /> Move to {NEXT_STATUS[selectedRx.status]}
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}

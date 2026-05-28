import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader } from "@/components/PageShell";
import { fmtDate, fmtMoney, fmtNumber, fmtDateTime } from "@/lib/format";
import { AlertTriangle, FileText, ShoppingBag, Award, Heart, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/app/patients")({ component: Patients });

function Patients() {
  const [selected, setSelected] = useState<any>(null);

  const { data } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: patientDetail } = useQuery({
    queryKey: ["patient-detail", selected?.id],
    queryFn: async () => {
      if (!selected?.id) return null;
      const [{ data: prescriptions }, { data: sales }, { data: loyalty }] = await Promise.all([
        supabase.from("prescriptions").select("*, prescription_items(*, products(name, strength))").eq("patient_id", selected.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("sales").select("*, sale_items(product_name, quantity, total_price)").eq("patient_id", selected.id).order("sale_date", { ascending: false }).limit(20),
        supabase.from("loyalty_transactions").select("*").eq("patient_id", selected.id).order("created_at", { ascending: false }).limit(20),
      ]);
      return { prescriptions: prescriptions ?? [], sales: sales ?? [], loyalty: loyalty ?? [] };
    },
    enabled: !!selected?.id,
  });

  return (
    <PageShell>
      <PageHeader title="Patients" subtitle="Patient records, allergies & loyalty" />
      <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Code</th>
              <th className="text-left px-6 py-3 font-medium">Name</th>
              <th className="text-left px-6 py-3 font-medium">DOB</th>
              <th className="text-left px-6 py-3 font-medium">Phone</th>
              <th className="text-left px-6 py-3 font-medium">Allergies</th>
              <th className="text-left px-6 py-3 font-medium">Conditions</th>
              <th className="text-right px-6 py-3 font-medium">Loyalty</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p: any) => (
              <tr key={p.id} onClick={() => setSelected(p)} className="border-t hover:bg-muted/30 cursor-pointer">
                <td className="px-6 py-3 text-mono text-xs">{p.patient_code}</td>
                <td className="px-6 py-3 font-medium">{p.full_name}</td>
                <td className="px-6 py-3 text-muted-foreground">{fmtDate(p.date_of_birth)}</td>
                <td className="px-6 py-3 text-mono text-xs">{p.phone}</td>
                <td className="px-6 py-3">
                  {p.allergies?.length ? (
                    <span className="inline-flex items-center gap-1 text-xs text-danger font-medium"><AlertTriangle className="h-3 w-3" />{p.allergies.join(", ")}</span>
                  ) : <span className="text-muted-foreground text-xs">None</span>}
                </td>
                <td className="px-6 py-3 text-xs text-muted-foreground">{p.chronic_conditions?.join(", ") || "—"}</td>
                <td className="px-6 py-3 text-right text-mono font-semibold text-primary">{fmtNumber(p.loyalty_points)} pts</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> {selected.full_name}
                  <Badge variant="outline" className="text-mono">{selected.patient_code}</Badge>
                </SheetTitle>
                <SheetDescription>Patient record details</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Phone:</span><div className="font-medium">{selected.phone ?? "—"}</div></div>
                  <div><span className="text-muted-foreground">Email:</span><div className="font-medium">{selected.email ?? "—"}</div></div>
                  <div><span className="text-muted-foreground">DOB:</span><div className="font-medium">{fmtDate(selected.date_of_birth)}</div></div>
                  <div><span className="text-muted-foreground">Gender:</span><div className="font-medium">{selected.gender ?? "—"}</div></div>
                  <div><span className="text-muted-foreground">Blood Type:</span><div className="font-medium">{selected.blood_type ?? "—"}</div></div>
                  <div><span className="text-muted-foreground">Loyalty:</span><div className="font-medium text-primary">{selected.loyalty_points ?? 0} pts</div></div>
                </div>

                {selected.allergies?.length > 0 && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-destructive"><AlertTriangle className="h-4 w-4" /> Allergies</div>
                    <div className="mt-1 text-sm">{selected.allergies.join(", ")}</div>
                  </div>
                )}

                {selected.chronic_conditions?.length > 0 && (
                  <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium"><Heart className="h-4 w-4" /> Chronic Conditions</div>
                    <div className="mt-1 text-sm">{selected.chronic_conditions.join(", ")}</div>
                  </div>
                )}

                {selected.insurance_provider && (
                  <div className="rounded-lg bg-muted/30 p-3 text-sm">
                    <span className="text-muted-foreground">Insurance:</span> {selected.insurance_provider} · {selected.insurance_number ?? "—"}
                  </div>
                )}

                <Tabs defaultValue="rx" className="mt-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="rx" className="flex-1"><FileText className="h-3 w-3 mr-1" /> Prescriptions</TabsTrigger>
                    <TabsTrigger value="orders" className="flex-1"><ShoppingBag className="h-3 w-3 mr-1" /> Orders</TabsTrigger>
                    <TabsTrigger value="loyalty" className="flex-1"><Award className="h-3 w-3 mr-1" /> Loyalty</TabsTrigger>
                  </TabsList>

                  <TabsContent value="rx" className="space-y-2 mt-3">
                    {(patientDetail?.prescriptions ?? []).length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No prescriptions</div>}
                    {(patientDetail?.prescriptions ?? []).map((rx: any) => (
                      <div key={rx.id} className="rounded-lg bg-muted/30 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-muted-foreground">{rx.prescription_number}</span>
                          <Badge variant="outline" className="text-xs capitalize">{rx.status}</Badge>
                        </div>
                        <div className="mt-1">Dr. {rx.prescriber_name}</div>
                        <div className="text-xs text-muted-foreground">{fmtDate(rx.issue_date)}</div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="orders" className="space-y-2 mt-3">
                    {(patientDetail?.sales ?? []).length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No orders</div>}
                    {(patientDetail?.sales ?? []).map((sale: any) => (
                      <div key={sale.id} className="rounded-lg bg-muted/30 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-muted-foreground">{sale.receipt_number}</span>
                          <span className="font-semibold text-primary">{fmtMoney(sale.total_amount)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{fmtDateTime(sale.sale_date)}</div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="loyalty" className="space-y-2 mt-3">
                    {(patientDetail?.loyalty ?? []).length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No transactions</div>}
                    {(patientDetail?.loyalty ?? []).map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3 text-sm">
                        <div>
                          <div className="capitalize">{tx.transaction_type}</div>
                          <div className="text-xs text-muted-foreground">{fmtDateTime(tx.created_at)}</div>
                        </div>
                        <div className="text-right">
                          {tx.points_earned > 0 && <div className="text-green-600 text-mono">+{tx.points_earned}</div>}
                          {tx.points_redeemed > 0 && <div className="text-red-600 text-mono">-{tx.points_redeemed}</div>}
                          <div className="text-xs text-muted-foreground">Bal: {tx.balance_after}</div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}

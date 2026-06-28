import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageShell";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FileText } from "lucide-react";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/customer/prescriptions")({
  component: CustomerPrescriptions,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  verifying: "bg-blue-100 text-blue-800",
  dispensing: "bg-violet-100 text-violet-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  expired: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-800",
};

function CustomerPrescriptions() {
  const { user } = useAuth();

  const { data: patientId } = useQuery({
    queryKey: ["customer-patient-id", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("patients").select("id").eq("user_id", user.id).single();
      return data?.id ?? null;
    },
    enabled: !!user,
  });

  const { data: prescriptions } = useQuery({
    queryKey: ["customer-prescriptions", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data } = await supabase
        .from("prescriptions")
        .select("*, prescription_items(*, products(name, strength, dosage_form))")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!patientId,
  });

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      <PageHeader title="My Prescriptions" subtitle="View your prescription history and status" />
      {!prescriptions || prescriptions.length === 0 ? (
        <div className="rounded-2xl bg-card border p-12 shadow-card text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-display font-semibold text-lg">No prescriptions yet</h3>
          <p className="mt-2 text-muted-foreground">
            Your prescriptions will appear here once your pharmacist creates them.
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {prescriptions.map((rx: any) => (
            <AccordionItem
              key={rx.id}
              value={rx.id}
              className="rounded-xl bg-card border shadow-card overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-4 text-left">
                  <div>
                    <div className="font-mono text-sm text-muted-foreground">
                      {rx.prescription_number}
                    </div>
                    <div className="font-medium">Dr. {rx.prescriber_name}</div>
                    <div className="text-xs text-muted-foreground">{fmtDate(rx.issue_date)}</div>
                  </div>
                  <Badge className={STATUS_COLORS[rx.status] ?? ""}>{rx.status}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-2">
                  {(rx.prescription_items ?? []).map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-muted/30 p-3 text-sm"
                    >
                      <div>
                        <div className="font-medium">
                          {item.products?.name} {item.products?.strength}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {item.dosage} · {item.frequency} · {item.duration}
                        </div>
                      </div>
                      <div className="text-mono text-sm">x{item.quantity_prescribed}</div>
                    </div>
                  ))}
                  {rx.notes && (
                    <div className="text-sm text-muted-foreground mt-2">Notes: {rx.notes}</div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

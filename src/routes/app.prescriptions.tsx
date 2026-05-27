import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader, EmptyState } from "@/components/PageShell";
import { fmtDate } from "@/lib/format";
import { FileText, Plus } from "lucide-react";

export const Route = createFileRoute("/app/prescriptions")({ component: Prescriptions });

const COLS = ["pending", "verifying", "dispensing", "ready", "completed"] as const;

function Prescriptions() {
  const { data } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: async () => {
      const { data } = await supabase.from("prescriptions").select("*, patients(full_name)").order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  return (
    <PageShell>
      <PageHeader title="Prescriptions" subtitle="Dispensing queue across all branches" action={
        <button className="inline-flex items-center gap-2 rounded-lg gradient-primary text-white font-semibold px-4 py-2.5 text-sm shadow-glow"><Plus className="h-4 w-4" /> New prescription</button>
      } />
      {!data?.length ? (
        <EmptyState icon={FileText} title="No prescriptions yet" message="Prescriptions you process will appear in the kanban board." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {COLS.map((status) => (
            <div key={status} className="rounded-xl bg-muted/40 p-3 min-h-[400px]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 capitalize">{status}</h3>
              <div className="space-y-2">
                {(data ?? []).filter((p: any) => p.status === status).map((p: any) => (
                  <div key={p.id} className="rounded-lg bg-card border p-3 shadow-card cursor-pointer hover:shadow-glow transition">
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
    </PageShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader } from "@/components/PageShell";
import { fmtDate, fmtNumber } from "@/lib/format";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/patients")({ component: Patients });

function Patients() {
  const { data } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <PageShell>
      <PageHeader title="Patients" subtitle="Patient records, allergies & loyalty" />
      <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground"><tr><th className="text-left px-6 py-3 font-medium">Code</th><th className="text-left px-6 py-3 font-medium">Name</th><th className="text-left px-6 py-3 font-medium">DOB</th><th className="text-left px-6 py-3 font-medium">Phone</th><th className="text-left px-6 py-3 font-medium">Allergies</th><th className="text-left px-6 py-3 font-medium">Conditions</th><th className="text-right px-6 py-3 font-medium">Loyalty</th></tr></thead>
          <tbody>
            {(data ?? []).map((p: any) => (
              <tr key={p.id} className="border-t hover:bg-muted/30">
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
    </PageShell>
  );
}

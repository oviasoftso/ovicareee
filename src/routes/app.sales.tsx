import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader } from "@/components/PageShell";
import { fmtMoney, fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/app/sales")({ component: Sales });

function Sales() {
  const { data } = useQuery({
    queryKey: ["sales-all"],
    queryFn: async () => {
      const { data } = await supabase.from("sales").select("*, branches(name)").order("sale_date", { ascending: false }).limit(100);
      return data ?? [];
    },
  });
  return (
    <PageShell>
      <PageHeader title="Sales History" subtitle="Recent transactions across the network" />
      <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground"><tr><th className="text-left px-6 py-3 font-medium">Receipt</th><th className="text-left px-6 py-3 font-medium">Branch</th><th className="text-left px-6 py-3 font-medium">Payment</th><th className="text-right px-6 py-3 font-medium">Total</th><th className="text-right px-6 py-3 font-medium">Date</th></tr></thead>
          <tbody>
            {(data ?? []).map((s: any) => (
              <tr key={s.id} className="border-t hover:bg-muted/30">
                <td className="px-6 py-3 text-mono text-xs">{s.receipt_number}</td>
                <td className="px-6 py-3">{s.branches?.name ?? "—"}</td>
                <td className="px-6 py-3 capitalize">{s.payment_method?.replace("_", " ")}</td>
                <td className="px-6 py-3 text-right text-mono font-semibold">{fmtMoney(s.total_amount)}</td>
                <td className="px-6 py-3 text-right text-xs text-muted-foreground">{fmtDateTime(s.sale_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

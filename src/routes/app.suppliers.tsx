import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader, StatCard } from "@/components/PageShell";
import { Truck, Star, TrendingUp, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/suppliers")({ component: Suppliers });

function Suppliers() {
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data } = await supabase.from("suppliers").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("purchase_orders").select("supplier_id, status, total_amount, ordered_at, received_at");
      return data ?? [];
    },
  });

  const supplierStats = (suppliers ?? []).map((s: any) => {
    const sOrders = (orders ?? []).filter((o: any) => o.supplier_id === s.id);
    const totalOrders = sOrders.length;
    const totalValue = sOrders.reduce((a: number, o: any) => a + Number(o.total_amount), 0);
    const received = sOrders.filter((o: any) => o.status === "received");
    const onTime = received.filter((o: any) => o.received_at && o.ordered_at && new Date(o.received_at) <= new Date(new Date(o.ordered_at).getTime() + 7 * 86400000));
    const fillRate = received.length > 0 ? Math.round((onTime.length / received.length) * 100) : 0;
    return { ...s, totalOrders, totalValue, fillRate };
  });

  const activeSuppliers = (suppliers ?? []).filter((s: any) => s.is_active).length;
  const avgRating = suppliers?.length ? ((suppliers as any[]).reduce((a: number, s: any) => a + (s.rating ?? 0), 0) / suppliers.length).toFixed(1) : "0";

  return (
    <PageShell>
      <PageHeader title="Supplier Performance" subtitle="Track vendor delivery speeds, pricing, and fill rates" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <StatCard label="Active Suppliers" value={String(activeSuppliers)} icon={Truck} tone="primary" />
        <StatCard label="Avg Rating" value={avgRating} icon={Star} tone="amber" />
        <StatCard label="Total POs" value={String(orders?.length ?? 0)} icon={Package} tone="violet" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {supplierStats.map((s: any) => (
          <div key={s.id} className="rounded-xl bg-card border p-5 shadow-card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-display font-semibold">{s.name}</h3>
                <p className="text-sm text-muted-foreground">{s.contact_person ?? "—"}</p>
              </div>
              <Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Active" : "Inactive"}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Orders:</span><div className="font-medium text-mono">{s.totalOrders}</div></div>
              <div><span className="text-muted-foreground">Value:</span><div className="font-medium text-mono">${s.totalValue.toFixed(0)}</div></div>
              <div><span className="text-muted-foreground">Rating:</span><div className="font-medium">{s.rating ?? 0}/5 <Star className="h-3 w-3 inline text-amber" /></div></div>
              <div><span className="text-muted-foreground">On-time:</span><div className="font-medium">{s.fillRate}%</div></div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{s.email ?? ""} {s.phone ? `· ${s.phone}` : ""}</div>
          </div>
        ))}
        {supplierStats.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">No suppliers found.</div>
        )}
      </div>
    </PageShell>
  );
}

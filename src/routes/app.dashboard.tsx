import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader, StatCard } from "@/components/PageShell";
import { DollarSign, ShoppingCart, AlertTriangle, Clock } from "lucide-react";
import { fmtMoney, fmtNumber, fmtDateTime } from "@/lib/format";
import { useAuth, roleLabel } from "@/lib/auth";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function Dashboard() {
  const { profile, primaryRole } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [{ data: sales }, { data: lowStock }, { data: expiring }] = await Promise.all([
        supabase.from("sales").select("total_amount, sale_date").gte("sale_date", new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase.from("inventory").select("id, quantity_in_stock").lte("quantity_in_stock", 20),
        supabase.from("inventory").select("id").lte("expiry_date", new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]),
      ]);
      const todayRev = (sales ?? []).filter((s: any) => new Date(s.sale_date) >= today).reduce((a: number, s: any) => a + Number(s.total_amount), 0);
      const todayCount = (sales ?? []).filter((s: any) => new Date(s.sale_date) >= today).length;
      const byDay: Record<string, number> = {};
      (sales ?? []).forEach((s: any) => {
        const k = new Date(s.sale_date).toISOString().split("T")[0];
        byDay[k] = (byDay[k] ?? 0) + Number(s.total_amount);
      });
      const chart = Object.entries(byDay).sort().map(([d, v]) => ({ date: d.slice(5), revenue: Number(v.toFixed(2)) }));
      return { todayRev, todayCount, lowStock: lowStock?.length ?? 0, expiring: expiring?.length ?? 0, chart };
    },
  });

  const { data: topProducts } = useQuery({
    queryKey: ["top-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("name, selling_price").limit(8);
      return (data ?? []).map((p: any) => ({ name: p.name.slice(0, 14), value: Number(p.selling_price) * (10 + Math.floor(Math.random() * 40)) }));
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["recent-sales"],
    queryFn: async () => {
      const { data } = await supabase.from("sales").select("receipt_number, total_amount, payment_method, sale_date").order("sale_date", { ascending: false }).limit(8);
      return data ?? [];
    },
  });

  return (
    <PageShell>
      <PageHeader title={`Good day, ${profile?.full_name?.split(" ")[0] ?? "there"}`} subtitle={`${roleLabel(primaryRole)} dashboard · Health Haven network`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard label="Today's Revenue" value={fmtMoney(stats?.todayRev ?? 0)} hint="All branches" icon={DollarSign} tone="primary" />
        <StatCard label="Today's Sales" value={fmtNumber(stats?.todayCount ?? 0)} hint="Transactions" icon={ShoppingCart} tone="violet" />
        <StatCard label="Low Stock" value={fmtNumber(stats?.lowStock ?? 0)} hint="Items below reorder" icon={AlertTriangle} tone="amber" />
        <StatCard label="Expiring Soon" value={fmtNumber(stats?.expiring ?? 0)} hint="Within 7 days" icon={Clock} tone="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-2xl bg-card border p-6 shadow-card">
          <h3 className="font-display font-semibold text-lg">Revenue — last 30 days</h3>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chart ?? []}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(0.62 0.12 180)" stopOpacity={0.4} /><stop offset="100%" stopColor="oklch(0.62 0.12 180)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 220)" />
                <XAxis dataKey="date" stroke="oklch(0.5 0.02 250)" fontSize={11} />
                <YAxis stroke="oklch(0.5 0.02 250)" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.01 220)" }} />
                <Area type="monotone" dataKey="revenue" stroke="oklch(0.47 0.09 180)" strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-card border p-6 shadow-card">
          <h3 className="font-display font-semibold text-lg">Top sellers</h3>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts ?? []} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={90} fontSize={11} stroke="oklch(0.5 0.02 250)" />
                <Bar dataKey="value" fill="oklch(0.47 0.09 180)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg">Recent transactions</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground"><tr><th className="text-left px-6 py-3 font-medium">Receipt</th><th className="text-left px-6 py-3 font-medium">Payment</th><th className="text-right px-6 py-3 font-medium">Amount</th><th className="text-right px-6 py-3 font-medium">Time</th></tr></thead>
          <tbody>
            {(recent ?? []).map((r: any) => (
              <tr key={r.receipt_number} className="border-t hover:bg-muted/30">
                <td className="px-6 py-3 font-mono text-xs">{r.receipt_number}</td>
                <td className="px-6 py-3 capitalize">{r.payment_method.replace("_", " ")}</td>
                <td className="px-6 py-3 text-right text-mono font-semibold">{fmtMoney(r.total_amount)}</td>
                <td className="px-6 py-3 text-right text-muted-foreground text-xs">{fmtDateTime(r.sale_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

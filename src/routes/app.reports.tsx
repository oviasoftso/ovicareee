import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader, StatCard } from "@/components/PageShell";
import { BarChart3, TrendingUp, Receipt, Package, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { fmtMoney, fmtNumber } from "@/lib/format";

export const Route = createFileRoute("/app/reports")({ component: ReportsPage });

const COLORS = ["oklch(0.62 0.18 195)", "oklch(0.72 0.16 145)", "oklch(0.74 0.16 75)", "oklch(0.65 0.22 295)", "oklch(0.65 0.22 25)"];

function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const [{ data: sales }, { data: items }, { data: products }] = await Promise.all([
        supabase.from("sales").select("id, total_amount, sale_date, payment_method, branch_id"),
        supabase.from("sale_items").select("product_name, quantity, total_price"),
        supabase.from("products").select("id, category_id, name"),
      ]);

      const byMethod = new Map<string, number>();
      (sales ?? []).forEach((s: any) => {
        byMethod.set(s.payment_method, (byMethod.get(s.payment_method) ?? 0) + Number(s.total_amount));
      });

      const byProduct = new Map<string, { qty: number; rev: number }>();
      (items ?? []).forEach((i: any) => {
        const cur = byProduct.get(i.product_name) ?? { qty: 0, rev: 0 };
        cur.qty += i.quantity;
        cur.rev += Number(i.total_price);
        byProduct.set(i.product_name, cur);
      });

      const last30 = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        last30.set(d.toISOString().slice(0, 10), 0);
      }
      (sales ?? []).forEach((s: any) => {
        const key = new Date(s.sale_date).toISOString().slice(0, 10);
        if (last30.has(key)) last30.set(key, (last30.get(key) ?? 0) + Number(s.total_amount));
      });

      return {
        totalRevenue: (sales ?? []).reduce((a: number, s: any) => a + Number(s.total_amount), 0),
        totalTx: sales?.length ?? 0,
        totalUnits: (items ?? []).reduce((a: number, i: any) => a + i.quantity, 0),
        skus: products?.length ?? 0,
        byMethod: Array.from(byMethod, ([name, value]) => ({ name: name.toUpperCase(), value })),
        topProducts: Array.from(byProduct, ([name, v]) => ({ name, ...v })).sort((a, b) => b.rev - a.rev).slice(0, 10),
        revenueByDay: Array.from(last30, ([date, value]) => ({ date: date.slice(5), value })),
      };
    },
  });

  if (isLoading || !data) return <PageShell><div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></PageShell>;

  return (
    <PageShell>
      <PageHeader title="Reports" subtitle="Insights across sales, products and payments." />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total revenue" value={fmtMoney(data.totalRevenue)} icon={TrendingUp} tone="success" />
        <StatCard label="Transactions" value={fmtNumber(data.totalTx)} icon={Receipt} tone="primary" />
        <StatCard label="Units sold" value={fmtNumber(data.totalUnits)} icon={Package} tone="violet" />
        <StatCard label="Active SKUs" value={fmtNumber(data.skus)} icon={BarChart3} tone="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 rounded-2xl bg-card border p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4">Revenue · last 30 days</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.revenueByDay}>
              <XAxis dataKey="date" stroke="oklch(0.55 0 0)" fontSize={11} />
              <YAxis stroke="oklch(0.55 0 0)" fontSize={11} />
              <Tooltip contentStyle={{ background: "oklch(0.99 0 0)", border: "1px solid oklch(0.92 0 0)", borderRadius: 12 }} />
              <Bar dataKey="value" fill="oklch(0.62 0.18 195)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl bg-card border p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4">Payment methods</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.byMethod} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                {data.byMethod.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
        <h3 className="font-display font-semibold p-6 pb-3">Top 10 products by revenue</h3>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="px-6 py-3">Product</th><th className="px-6 py-3 text-right">Units</th><th className="px-6 py-3 text-right">Revenue</th></tr>
          </thead>
          <tbody className="divide-y">
            {data.topProducts.map((p) => (
              <tr key={p.name} className="hover:bg-muted/30">
                <td className="px-6 py-3 font-medium">{p.name}</td>
                <td className="px-6 py-3 text-right text-mono">{fmtNumber(p.qty)}</td>
                <td className="px-6 py-3 text-right text-mono font-semibold">{fmtMoney(p.rev)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

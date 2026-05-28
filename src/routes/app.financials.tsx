import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader, StatCard } from "@/components/PageShell";
import { DollarSign, TrendingUp, TrendingDown, Percent } from "lucide-react";
import { fmtMoney } from "@/lib/format";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from "recharts";

export const Route = createFileRoute("/app/financials")({ component: Financials });

function Financials() {
  const { data } = useQuery({
    queryKey: ["financials"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const [{ data: sales }, { data: expenses }] = await Promise.all([
        supabase.from("sales").select("total_amount, sale_date, branches(name)").gte("sale_date", thirtyDaysAgo),
        supabase.from("expenses").select("amount, expense_date, category, branch_id").gte("expense_date", thirtyDaysAgo),
      ]);

      const rev = (sales ?? []).reduce((a: number, s: any) => a + Number(s.total_amount), 0);
      const exp = (expenses ?? []).reduce((a: number, e: any) => a + Number(e.amount), 0);

      const byDay: Record<string, { rev: number; exp: number }> = {};
      (sales ?? []).forEach((s: any) => {
        const k = new Date(s.sale_date).toISOString().split("T")[0];
        if (!byDay[k]) byDay[k] = { rev: 0, exp: 0 };
        byDay[k].rev += Number(s.total_amount);
      });
      (expenses ?? []).forEach((e: any) => {
        const k = new Date(e.expense_date).toISOString().split("T")[0];
        if (!byDay[k]) byDay[k] = { rev: 0, exp: 0 };
        byDay[k].exp += Number(e.amount);
      });

      const chart = Object.entries(byDay).sort().map(([d, v]) => ({ date: d.slice(5), revenue: Number(v.rev.toFixed(2)), expenses: Number(v.exp.toFixed(2)) }));

      const byBranch: Record<string, number> = {};
      (sales ?? []).forEach((s: any) => {
        const n = s.branches?.name ?? "Unknown";
        byBranch[n] = (byBranch[n] ?? 0) + Number(s.total_amount);
      });
      const branchData = Object.entries(byBranch).map(([name, value]) => ({ name, revenue: Number(value.toFixed(2)) }));

      const expByCategory: Record<string, number> = {};
      (expenses ?? []).forEach((e: any) => {
        const cat = e.category ?? "Other";
        expByCategory[cat] = (expByCategory[cat] ?? 0) + Number(e.amount);
      });
      const expenseCategories = Object.entries(expByCategory).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));

      return { rev, exp, profit: rev - exp, margin: rev ? ((rev - exp) / rev) * 100 : 0, chart, branchData, expenseCategories };
    },
  });

  return (
    <PageShell>
      <PageHeader title="Financial Overview" subtitle="Last 30 days · all branches" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard label="Revenue" value={fmtMoney(data?.rev ?? 0)} icon={DollarSign} tone="primary" />
        <StatCard label="Expenses" value={fmtMoney(data?.exp ?? 0)} icon={TrendingDown} tone="danger" />
        <StatCard label="Net Profit" value={fmtMoney(data?.profit ?? 0)} icon={TrendingUp} tone="success" />
        <StatCard label="Margin" value={`${(data?.margin ?? 0).toFixed(1)}%`} icon={Percent} tone="violet" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-card border p-6 shadow-card">
          <h3 className="font-display font-semibold text-lg mb-4">Revenue vs Expenses</h3>
          <div className="h-72"><ResponsiveContainer>
            <AreaChart data={data?.chart ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 220)" />
              <XAxis dataKey="date" fontSize={11} /><YAxis fontSize={11} /><Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="oklch(0.47 0.09 180)" fill="oklch(0.47 0.09 180 / 0.2)" />
              <Area type="monotone" dataKey="expenses" stroke="oklch(0.62 0.22 25)" fill="oklch(0.62 0.22 25 / 0.15)" />
            </AreaChart>
          </ResponsiveContainer></div>
        </div>
        <div className="rounded-2xl bg-card border p-6 shadow-card">
          <h3 className="font-display font-semibold text-lg mb-4">By Branch</h3>
          <div className="h-72"><ResponsiveContainer>
            <BarChart data={data?.branchData ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 220)" />
              <XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Legend />
              <Bar dataKey="revenue" fill="oklch(0.47 0.09 180)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer></div>
        </div>
      </div>
      {data?.expenseCategories && data.expenseCategories.length > 0 && (
        <div className="mt-6 rounded-2xl bg-card border p-6 shadow-card">
          <h3 className="font-display font-semibold text-lg mb-4">Expense Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.expenseCategories.map((cat) => (
              <div key={cat.name} className="rounded-lg bg-muted/40 p-4 text-center">
                <div className="text-sm text-muted-foreground capitalize">{cat.name}</div>
                <div className="text-xl font-display font-bold mt-1">{fmtMoney(cat.value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader, StatCard } from "@/components/PageShell";
import { DollarSign, TrendingUp, TrendingDown, Percent, CreditCard, Clock } from "lucide-react";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export const Route = createFileRoute("/app/financials")({ component: Financials });

function Financials() {
  const { data } = useQuery({
    queryKey: ["financials"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const [{ data: sales }, { data: expenses }, { data: creditSales }] = await Promise.all([
        supabase
          .from("sales")
          .select("total_amount, sale_date, branches(name)")
          .gte("sale_date", thirtyDaysAgo),
        supabase
          .from("expenses")
          .select("amount, expense_date, category, branch_id")
          .gte("expense_date", thirtyDaysAgo),
        supabase
          .from("sales")
          .select(
            "id, receipt_number, total_amount, amount_paid, due_date, sale_date, patients(full_name)",
          )
          .eq("is_credit", true)
          .order("sale_date", { ascending: false }),
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

      const chart = Object.entries(byDay)
        .sort()
        .map(([d, v]) => ({
          date: d.slice(5),
          revenue: Number(v.rev.toFixed(2)),
          expenses: Number(v.exp.toFixed(2)),
        }));

      const byBranch: Record<string, number> = {};
      (sales ?? []).forEach((s: any) => {
        const n = s.branches?.name ?? "Unknown";
        byBranch[n] = (byBranch[n] ?? 0) + Number(s.total_amount);
      });
      const branchData = Object.entries(byBranch).map(([name, value]) => ({
        name,
        revenue: Number(value.toFixed(2)),
      }));

      const expByCategory: Record<string, number> = {};
      (expenses ?? []).forEach((e: any) => {
        const cat = e.category ?? "Other";
        expByCategory[cat] = (expByCategory[cat] ?? 0) + Number(e.amount);
      });
      const expenseCategories = Object.entries(expByCategory).map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      }));

      const ar = (creditSales ?? []).filter(
        (s: any) => Number(s.amount_paid) < Number(s.total_amount),
      );
      const arTotal = ar.reduce(
        (a: number, s: any) => a + (Number(s.total_amount) - Number(s.amount_paid)),
        0,
      );

      const now = Date.now();
      const arAging = { current: 0, days30: 0, days60: 0, days90: 0 };
      ar.forEach((s: any) => {
        const outstanding = Number(s.total_amount) - Number(s.amount_paid);
        const age = Math.floor((now - new Date(s.sale_date).getTime()) / 86400000);
        if (age <= 30) arAging.current += outstanding;
        else if (age <= 60) arAging.days30 += outstanding;
        else if (age <= 90) arAging.days60 += outstanding;
        else arAging.days90 += outstanding;
      });

      return {
        rev,
        exp,
        profit: rev - exp,
        margin: rev ? ((rev - exp) / rev) * 100 : 0,
        chart,
        branchData,
        expenseCategories,
        ar,
        arTotal,
        arAging,
      };
    },
  });

  return (
    <PageShell>
      <PageHeader title="Financial Overview" subtitle="Last 30 days · all branches" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Revenue"
          value={fmtMoney(data?.rev ?? 0)}
          icon={DollarSign}
          tone="primary"
        />
        <StatCard
          label="Expenses"
          value={fmtMoney(data?.exp ?? 0)}
          icon={TrendingDown}
          tone="danger"
        />
        <StatCard
          label="Net Profit"
          value={fmtMoney(data?.profit ?? 0)}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Margin"
          value={`${(data?.margin ?? 0).toFixed(1)}%`}
          icon={Percent}
          tone="violet"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl bg-card border p-6 shadow-card">
          <h3 className="font-display font-semibold text-lg mb-4">Revenue vs Expenses</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={data?.chart ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 220)" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.47 0.09 180)"
                  fill="oklch(0.47 0.09 180 / 0.2)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="oklch(0.62 0.22 25)"
                  fill="oklch(0.62 0.22 25 / 0.15)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl bg-card border p-6 shadow-card">
          <h3 className="font-display font-semibold text-lg mb-4">By Branch</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data?.branchData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 220)" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="oklch(0.47 0.09 180)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl bg-card border p-6 shadow-card">
          <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Accounts Receivable
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <div className="text-sm text-muted-foreground">Total Outstanding</div>
              <div className="text-2xl font-display font-bold text-primary">
                {fmtMoney(data?.arTotal ?? 0)}
              </div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <div className="text-sm text-muted-foreground">Credit Invoices</div>
              <div className="text-2xl font-display font-bold">{data?.ar?.length ?? 0}</div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div className="rounded-lg bg-green-50 p-2">
              <div className="text-xs text-muted-foreground">Current</div>
              <div className="font-semibold text-green-700">
                {fmtMoney(data?.arAging?.current ?? 0)}
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 p-2">
              <div className="text-xs text-muted-foreground">30 days</div>
              <div className="font-semibold text-amber-700">
                {fmtMoney(data?.arAging?.days30 ?? 0)}
              </div>
            </div>
            <div className="rounded-lg bg-orange-50 p-2">
              <div className="text-xs text-muted-foreground">60 days</div>
              <div className="font-semibold text-orange-700">
                {fmtMoney(data?.arAging?.days60 ?? 0)}
              </div>
            </div>
            <div className="rounded-lg bg-red-50 p-2">
              <div className="text-xs text-muted-foreground">90+ days</div>
              <div className="font-semibold text-red-700">
                {fmtMoney(data?.arAging?.days90 ?? 0)}
              </div>
            </div>
          </div>
        </div>

        {data?.expenseCategories && data.expenseCategories.length > 0 && (
          <div className="rounded-2xl bg-card border p-6 shadow-card">
            <h3 className="font-display font-semibold text-lg mb-4">Expense Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              {data.expenseCategories.map((cat) => (
                <div key={cat.name} className="rounded-lg bg-muted/40 p-4 text-center">
                  <div className="text-sm text-muted-foreground capitalize">{cat.name}</div>
                  <div className="text-xl font-display font-bold mt-1">{fmtMoney(cat.value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {data?.ar && data.ar.length > 0 && (
        <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-display font-semibold">Outstanding Invoices</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-6 py-3 font-medium">Receipt</th>
                <th className="text-left px-6 py-3 font-medium">Patient</th>
                <th className="text-right px-6 py-3 font-medium">Total</th>
                <th className="text-right px-6 py-3 font-medium">Paid</th>
                <th className="text-right px-6 py-3 font-medium">Outstanding</th>
                <th className="text-left px-6 py-3 font-medium">Due Date</th>
                <th className="text-center px-6 py-3 font-medium">Age</th>
              </tr>
            </thead>
            <tbody>
              {data.ar.map((s: any) => {
                const outstanding = Number(s.total_amount) - Number(s.amount_paid);
                const age = Math.floor((Date.now() - new Date(s.sale_date).getTime()) / 86400000);
                return (
                  <tr key={s.id} className="border-t hover:bg-muted/30">
                    <td className="px-6 py-3 font-mono text-xs">{s.receipt_number}</td>
                    <td className="px-6 py-3">{s.patients?.full_name ?? "—"}</td>
                    <td className="px-6 py-3 text-right text-mono">{fmtMoney(s.total_amount)}</td>
                    <td className="px-6 py-3 text-right text-mono">{fmtMoney(s.amount_paid)}</td>
                    <td className="px-6 py-3 text-right text-mono font-semibold text-primary">
                      {fmtMoney(outstanding)}
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">
                      {s.due_date ? fmtDateTime(s.due_date) : "—"}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Badge
                        className={
                          age > 90
                            ? "bg-red-100 text-red-800"
                            : age > 60
                              ? "bg-orange-100 text-orange-800"
                              : age > 30
                                ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-800"
                        }
                      >
                        {age}d
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}

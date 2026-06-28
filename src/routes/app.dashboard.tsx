import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader, StatCard } from "@/components/PageShell";
import { DollarSign, ShoppingCart, AlertTriangle, Clock } from "lucide-react";
import { fmtMoney, fmtNumber, fmtDateTime } from "@/lib/format";
import { useAuth, roleLabel } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Glass } from "@/components/ui/glass";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function Dashboard() {
  const { profile, primaryRole } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [{ data: sales }, { data: lowStock }, { data: expiring }] = await Promise.all([
        supabase
          .from("sales")
          .select("total_amount, sale_date")
          .gte("sale_date", new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase.from("inventory").select("id, quantity_in_stock").lte("quantity_in_stock", 20),
        supabase
          .from("inventory")
          .select("id")
          .lte("expiry_date", new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]),
      ]);
      const todayRev = (sales ?? [])
        .filter((s: any) => new Date(s.sale_date) >= today)
        .reduce((a: number, s: any) => a + Number(s.total_amount), 0);
      const todayCount = (sales ?? []).filter((s: any) => new Date(s.sale_date) >= today).length;
      const byDay: Record<string, number> = {};
      (sales ?? []).forEach((s: any) => {
        const k = new Date(s.sale_date).toISOString().split("T")[0];
        byDay[k] = (byDay[k] ?? 0) + Number(s.total_amount);
      });
      const chart = Object.entries(byDay)
        .sort()
        .map(([d, v]) => ({ date: d.slice(5), revenue: Number(v.toFixed(2)) }));
      return {
        todayRev,
        todayCount,
        lowStock: lowStock?.length ?? 0,
        expiring: expiring?.length ?? 0,
        chart,
      };
    },
  });

  const { data: topProducts, isLoading: topProductsLoading } = useQuery({
    queryKey: ["top-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sale_items")
        .select("product_name, total_price")
        .order("total_price", { ascending: false })
        .limit(50);
      const grouped: Record<string, number> = {};
      (data ?? []).forEach((item: any) => {
        const name = (item.product_name ?? "Unknown").slice(0, 14);
        grouped[name] = (grouped[name] ?? 0) + Number(item.total_price);
      });
      return Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
    },
  });

  const { data: recent, isLoading: recentLoading } = useQuery({
    queryKey: ["recent-sales"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales")
        .select("receipt_number, total_amount, payment_method, sale_date")
        .order("sale_date", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  return (
    <PageShell>
      <PageHeader
        title={`Good day, ${profile?.full_name?.split(" ")[0] ?? "there"}`}
        subtitle={`${roleLabel(primaryRole)} dashboard · Health Haven network`}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statsLoading ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full mt-2" />
            <Skeleton className="h-14 w-full mt-2" />
            <Skeleton className="h-14 w-full mt-2" />
          </>
        ) : (
          <>
            <StatCard
              label="Today's Revenue"
              value={fmtMoney(stats?.todayRev ?? 0)}
              hint="All branches"
              icon={DollarSign}
              tone="primary"
            />
            <StatCard
              label="Today's Sales"
              value={fmtNumber(stats?.todayCount ?? 0)}
              hint="Transactions"
              icon={ShoppingCart}
              tone="violet"
            />
            <StatCard
              label="Low Stock"
              value={fmtNumber(stats?.lowStock ?? 0)}
              hint="Items below reorder"
              icon={AlertTriangle}
              tone="amber"
            />
            <StatCard
              label="Expiring Soon"
              value={fmtNumber(stats?.expiring ?? 0)}
              hint="Within 7 days"
              icon={Clock}
              tone="destructive"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <Glass className="lg:col-span-2 p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Revenue — last 30 days</h3>
          <div className="h-72">
            {statsLoading ? (
              <Skeleton className="h-full w-full animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.chart ?? []}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.62 0.12 180)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.62 0.12 180)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="oklch(0.62 0.12 180)"
                    fill="url(#g)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Glass>

        {/* Top Products Bar Chart */}
        <Glass className="lg:col-span-1 p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Top Products</h3>
          <div className="h-72">
            {topProductsLoading ? (
              <Skeleton className="h-full w-full animate-pulse rounded-lg" />
            ) : (
              <BarChart
                data={topProducts ?? []}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={({ index, ...rest }) => (
                    <text
                      x={0}
                      y={-10}
                      dy={0}
                      transform={`rotate(-30 ${x} ${y})`}
                      textAnchor="end"
                      style={{ fontSize: 12 }}
                    >
                      {rest.name}
                    </text>
                  )}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="oklch(0.62 0.12 180)" />
              </BarChart>
            )}
          </div>
        </Glass>

        {/* Recent Sales */}
        <Glass className="lg:col-span-1 p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Recent Sales</h3>
          <div className="space-y-4 h-72 overflow-y-auto">
            {recentLoading ? (
              <>
                <Skeleton className="h-10 w-full animate-pulse rounded" />
                <Skeleton className="h-10 w-full animate-pulse rounded-lg" />
                <Skeleton className="h-10 w-full animate-pulse rounded-lg" />
                <Skeleton className="h-10 w-full animate-pulse rounded-lg" />
              </>
            ) : (
              recent.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{sale.receipt_number ?? "N/A"}</p>
                    <p className="text-xs text-muted-foreground">
                      {sale.payment_method ?? "-"} • {fmtDateTime(new Date(sale.sale_date))}
                    </p>
                  </div>
                  <div className="text-right text-sm font-semibold">
                    {fmtMoney(sale.total_amount ?? 0)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Glass>
      </div>
    </PageShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader, StatCard } from "@/components/PageShell";
import { TrendingUp, DollarSign, FileText, Users } from "lucide-react";
import { fmtMoney, fmtNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/performance")({ component: Performance });

function Performance() {
  const { data: staff } = useQuery({
    queryKey: ["performance-staff"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, branch_id, is_active");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const { data: branches } = await supabase.from("branches").select("id, name");

      const staffIds = (roles ?? [])
        .filter((r: any) => r.role !== "customer")
        .map((r: any) => r.user_id);
      const staffProfiles = (profiles ?? []).filter((p: any) => staffIds.includes(p.id));
      const branchMap = new Map((branches ?? []).map((b: any) => [b.id, b.name]));
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, []);
        roleMap.get(r.user_id)!.push(r.role);
      });

      return staffProfiles.map((p: any) => ({
        ...p,
        roles: roleMap.get(p.id) ?? [],
        branchName: branchMap.get(p.branch_id) ?? "—",
      }));
    },
  });

  const { data: salesByStaff } = useQuery({
    queryKey: ["performance-sales"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales")
        .select("cashier_id, total_amount, sale_date")
        .gte("sale_date", new Date(Date.now() - 30 * 86400000).toISOString());
      const grouped: Record<string, { count: number; total: number }> = {};
      (data ?? []).forEach((s: any) => {
        if (!grouped[s.cashier_id]) grouped[s.cashier_id] = { count: 0, total: 0 };
        grouped[s.cashier_id].count++;
        grouped[s.cashier_id].total += Number(s.total_amount);
      });
      return grouped;
    },
  });

  const { data: rxByStaff } = useQuery({
    queryKey: ["performance-rx"],
    queryFn: async () => {
      const { data } = await supabase
        .from("prescriptions")
        .select("dispensed_by, status")
        .not("dispensed_by", "is", null);
      const grouped: Record<string, { total: number; completed: number }> = {};
      (data ?? []).forEach((r: any) => {
        if (!grouped[r.dispensed_by]) grouped[r.dispensed_by] = { total: 0, completed: 0 };
        grouped[r.dispensed_by].total++;
        if (r.status === "completed") grouped[r.dispensed_by].completed++;
      });
      return grouped;
    },
  });

  const totalSales = Object.values(salesByStaff ?? {}).reduce((a, s) => a + s.total, 0);
  const totalRx = Object.values(rxByStaff ?? {}).reduce((a, r) => a + r.total, 0);

  return (
    <PageShell>
      <PageHeader
        title="Staff Performance"
        subtitle="Sales and prescription metrics per team member"
      />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-6">
        <StatCard
          label="Team Size"
          value={fmtNumber(staff?.length ?? 0)}
          icon={Users}
          tone="primary"
        />
        <StatCard label="30d Sales" value={fmtMoney(totalSales)} icon={DollarSign} tone="success" />
        <StatCard label="30d Rx" value={fmtNumber(totalRx)} icon={FileText} tone="violet" />
        <StatCard
          label="Avg per Staff"
          value={fmtMoney(staff?.length ? totalSales / staff.length : 0)}
          icon={TrendingUp}
          tone="amber"
        />
      </div>

      <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Staff Member</th>
              <th className="text-left px-6 py-3 font-medium">Roles</th>
              <th className="text-left px-6 py-3 font-medium">Branch</th>
              <th className="text-right px-6 py-3 font-medium">Sales (30d)</th>
              <th className="text-right px-6 py-3 font-medium">Revenue</th>
              <th className="text-right px-6 py-3 font-medium">Rx Filled</th>
              <th className="text-center px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(staff ?? []).map((s: any) => {
              const sales = salesByStaff?.[s.id] ?? { count: 0, total: 0 };
              const rx = rxByStaff?.[s.id] ?? { total: 0, completed: 0 };
              return (
                <tr key={s.id} className="border-t hover:bg-muted/30">
                  <td className="px-6 py-3 font-medium">{s.full_name}</td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.roles.map((r: string) => (
                        <Badge key={r} variant="outline" className="text-[10px] capitalize">
                          {r.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{s.branchName}</td>
                  <td className="px-6 py-3 text-right text-mono">{sales.count}</td>
                  <td className="px-6 py-3 text-right text-mono font-semibold">
                    {fmtMoney(sales.total)}
                  </td>
                  <td className="px-6 py-3 text-right text-mono">
                    {rx.completed}/{rx.total}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <Badge
                      className={
                        s.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }
                    >
                      {s.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

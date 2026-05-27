import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader, StatCard } from "@/components/PageShell";
import { ShieldAlert, Database, Users, Building2, Activity, Loader2 } from "lucide-react";
import { fmtNumber, fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/app/super-admin")({ component: SuperAdminPage });

function SuperAdminPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["super-admin"],
    queryFn: async () => {
      const [profiles, roles, branches, products, sales, audit] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("role"),
        supabase.from("branches").select("id, name, is_active"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("sales").select("id", { count: "exact", head: true }),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(20),
      ]);
      const roleCounts = new Map<string, number>();
      (roles.data ?? []).forEach((r: any) => roleCounts.set(r.role, (roleCounts.get(r.role) ?? 0) + 1));
      return {
        userCount: profiles.count ?? 0,
        productCount: products.count ?? 0,
        salesCount: sales.count ?? 0,
        branches: branches.data ?? [],
        roleCounts: Array.from(roleCounts, ([role, count]) => ({ role, count })),
        audit: audit.data ?? [],
      };
    },
  });

  if (isLoading || !data) return <PageShell><div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></PageShell>;

  return (
    <PageShell>
      <PageHeader title="Super Admin" subtitle="System-wide operations, audit & infrastructure." />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Users" value={fmtNumber(data.userCount)} icon={Users} tone="primary" />
        <StatCard label="Branches" value={data.branches.length} icon={Building2} tone="violet" />
        <StatCard label="Products" value={fmtNumber(data.productCount)} icon={Database} tone="amber" />
        <StatCard label="Transactions" value={fmtNumber(data.salesCount)} icon={Activity} tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section className="rounded-2xl bg-card border shadow-card p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary" /> Role distribution</h3>
          <div className="space-y-2">
            {data.roleCounts.map((r) => (
              <div key={r.role} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="capitalize">{r.role.replace(/_/g, " ")}</span>
                <span className="font-mono font-semibold">{r.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-card border shadow-card p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Branches</h3>
          <div className="space-y-2">
            {data.branches.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="font-medium">{b.name}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${b.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                  {b.is_active ? "Active" : "Disabled"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl bg-card border shadow-card overflow-hidden">
        <h3 className="font-display font-semibold p-6 pb-3">Recent audit log</h3>
        {data.audit.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No audit entries yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="px-6 py-3">When</th><th className="px-6 py-3">Action</th><th className="px-6 py-3">Table</th><th className="px-6 py-3">User</th></tr>
            </thead>
            <tbody className="divide-y">
              {data.audit.map((a: any) => (
                <tr key={a.id}>
                  <td className="px-6 py-3 text-muted-foreground">{fmtDateTime(a.created_at)}</td>
                  <td className="px-6 py-3 font-medium">{a.action}</td>
                  <td className="px-6 py-3 text-mono text-xs">{a.table_name ?? "—"}</td>
                  <td className="px-6 py-3 font-mono text-xs">{a.user_id?.slice(0, 8) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </PageShell>
  );
}

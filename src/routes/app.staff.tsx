import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader, StatCard, EmptyState } from "@/components/PageShell";
import { UserCog, Users, ShieldCheck, Loader2 } from "lucide-react";
import { roleLabel, type AppRole } from "@/lib/auth";

export const Route = createFileRoute("/app/staff")({ component: StaffPage });

function StaffPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }, { data: branches }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, phone, branch_id, is_active, last_login, created_at"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("branches").select("id, name"),
      ]);
      const rolesByUser = new Map<string, AppRole[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role);
        rolesByUser.set(r.user_id, arr);
      });
      const branchById = new Map((branches ?? []).map((b: any) => [b.id, b.name]));
      return (profiles ?? [])
        .map((p: any) => ({
          ...p,
          roles: rolesByUser.get(p.id) ?? [],
          branch_name: p.branch_id ? branchById.get(p.branch_id) : null,
        }))
        .filter((p: any) => p.roles.some((r: AppRole) => r !== "customer"));
    },
  });

  if (isLoading)
    return (
      <PageShell>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </PageShell>
    );

  const staff = data ?? [];
  const activeCount = staff.filter((s: any) => s.is_active).length;
  const adminCount = staff.filter(
    (s: any) => s.roles.includes("super_admin") || s.roles.includes("director"),
  ).length;

  return (
    <PageShell>
      <PageHeader title="Staff" subtitle="Manage team members, roles and branch assignments." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total staff" value={staff.length} icon={Users} tone="primary" />
        <StatCard label="Active" value={activeCount} icon={ShieldCheck} tone="success" />
        <StatCard label="Admins" value={adminCount} icon={UserCog} tone="violet" />
      </div>

      {staff.length === 0 ? (
        <EmptyState
          title="No staff yet"
          message="Staff accounts will appear here once roles are assigned."
          icon={UserCog}
        />
      ) : (
        <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Roles</th>
                <th className="px-6 py-3">Branch</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {staff.map((s: any) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-6 py-3 font-medium">{s.full_name}</td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {s.roles.map((r: AppRole) => (
                        <span
                          key={r}
                          className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium"
                        >
                          {roleLabel(r)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{s.branch_name ?? "—"}</td>
                  <td className="px-6 py-3 text-muted-foreground">{s.phone ?? "—"}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                    >
                      {s.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}

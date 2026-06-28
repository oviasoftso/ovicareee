import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader, StatCard, EmptyState } from "@/components/PageShell";
import { Award, Star, Crown, Loader2 } from "lucide-react";
import { fmtNumber } from "@/lib/format";

export const Route = createFileRoute("/app/loyalty")({ component: LoyaltyPage });

const tier = (pts: number) =>
  pts >= 1000
    ? { name: "Platinum", color: "from-violet to-secondary" }
    : pts >= 500
      ? { name: "Gold", color: "from-amber to-amber" }
      : pts >= 100
        ? { name: "Silver", color: "from-primary to-primary-light" }
        : { name: "Bronze", color: "from-muted to-muted" };

function LoyaltyPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["loyalty"],
    queryFn: async () => {
      const { data: patients } = await supabase
        .from("patients")
        .select("id, full_name, patient_code, loyalty_points")
        .order("loyalty_points", { ascending: false })
        .limit(100);
      const total = (patients ?? []).reduce((a, p: any) => a + (p.loyalty_points ?? 0), 0);
      return { patients: patients ?? [], total };
    },
  });

  if (isLoading || !data)
    return (
      <PageShell>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </PageShell>
    );

  const platinum = data.patients.filter((p: any) => p.loyalty_points >= 1000).length;
  const gold = data.patients.filter(
    (p: any) => p.loyalty_points >= 500 && p.loyalty_points < 1000,
  ).length;

  return (
    <PageShell>
      <PageHeader title="Loyalty" subtitle="Customer tier program and points balance." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Points outstanding"
          value={fmtNumber(data.total)}
          icon={Star}
          tone="amber"
        />
        <StatCard label="Platinum members" value={platinum} icon={Crown} tone="violet" />
        <StatCard label="Gold members" value={gold} icon={Award} tone="primary" />
      </div>

      {data.patients.length === 0 ? (
        <EmptyState
          title="No loyalty members yet"
          message="Customers earn points automatically at POS checkout."
          icon={Award}
        />
      ) : (
        <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Member</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Tier</th>
                <th className="px-6 py-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.patients.map((p: any) => {
                const t = tier(p.loyalty_points);
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-6 py-3 font-medium">{p.full_name}</td>
                    <td className="px-6 py-3 text-mono text-muted-foreground">{p.patient_code}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${t.color} text-white px-3 py-1 text-xs font-semibold`}
                      >
                        <Star className="h-3 w-3" /> {t.name}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-mono font-semibold">
                      {fmtNumber(p.loyalty_points)}
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

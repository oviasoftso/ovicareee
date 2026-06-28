import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, StatCard } from "@/components/PageShell";
import { Award, FileText, ShoppingBag, Heart } from "lucide-react";

export const Route = createFileRoute("/customer/dashboard")({ component: CustomerDash });

function tierLabel(points: number): { name: string; next: string; hint: string } {
  if (points >= 2000) return { name: "Platinum", next: "", hint: "Top tier" };
  if (points >= 1000)
    return { name: "Gold", next: "Platinum", hint: `${2000 - points} pts to Platinum` };
  if (points >= 500) return { name: "Silver", next: "Gold", hint: `${1000 - points} pts to Gold` };
  return { name: "Bronze", next: "Silver", hint: `${500 - points} pts to Silver` };
}

function CustomerDash() {
  const { profile, user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["customer-dashboard", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: patient } = await supabase
        .from("patients")
        .select("id, loyalty_points")
        .eq("user_id", user.id)
        .single();
      if (!patient) return { points: 0, activeRx: 0, recentOrders: 0, tier: tierLabel(0) };

      const patientId = patient.id;
      const points = patient.loyalty_points ?? 0;

      const [{ count: activeRx }, { count: recentOrders }] = await Promise.all([
        supabase
          .from("prescriptions")
          .select("id", { count: "exact", head: true })
          .eq("patient_id", patientId)
          .not("status", "in", '("completed","expired","cancelled")'),
        supabase
          .from("sales")
          .select("id", { count: "exact", head: true })
          .eq("patient_id", patientId)
          .gte("sale_date", new Date(Date.now() - 30 * 86400000).toISOString()),
      ]);

      return {
        points,
        activeRx: activeRx ?? 0,
        recentOrders: recentOrders ?? 0,
        tier: tierLabel(points),
      };
    },
    enabled: !!user,
  });

  const points = stats?.points ?? 0;
  const tier = stats?.tier ?? tierLabel(0);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      <PageHeader
        title={`Welcome, ${profile?.full_name?.split(" ")[0] ?? "there"}`}
        subtitle="Your OviCare account"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard label="Loyalty Points" value={String(points)} icon={Award} tone="primary" />
        <StatCard
          label="Active Prescriptions"
          value={String(stats?.activeRx ?? 0)}
          icon={FileText}
          tone="violet"
        />
        <StatCard
          label="Recent Orders"
          value={String(stats?.recentOrders ?? 0)}
          icon={ShoppingBag}
          tone="success"
        />
        <StatCard label="Tier" value={tier.name} hint={tier.hint} icon={Heart} tone="amber" />
      </div>
      <div className="rounded-2xl bg-card border p-8 shadow-card text-center">
        <h3 className="font-display font-semibold text-xl">Your customer portal</h3>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          View prescriptions, track orders, redeem loyalty rewards and update your medical profile.
        </p>
      </div>
    </div>
  );
}

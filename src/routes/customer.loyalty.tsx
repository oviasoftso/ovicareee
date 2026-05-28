import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, StatCard } from "@/components/PageShell";
import { Award, TrendingUp, Gift } from "lucide-react";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/customer/loyalty")({ component: CustomerLoyalty });

function tierInfo(points: number) {
  if (points >= 2000) return { name: "Platinum", color: "text-violet-600", next: null, needed: 0 };
  if (points >= 1000) return { name: "Gold", color: "text-amber-600", next: "Platinum", needed: 2000 - points };
  if (points >= 500) return { name: "Silver", color: "text-gray-500", next: "Gold", needed: 1000 - points };
  return { name: "Bronze", color: "text-amber-800", next: "Silver", needed: 500 - points };
}

function CustomerLoyalty() {
  const { user } = useAuth();

  const { data: patientData } = useQuery({
    queryKey: ["customer-loyalty", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: patient } = await supabase.from("patients").select("id, loyalty_points").eq("user_id", user.id).single();
      if (!patient) return null;

      const { data: transactions } = await supabase.from("loyalty_transactions")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(50);

      return { points: patient.loyalty_points ?? 0, transactions: transactions ?? [] };
    },
    enabled: !!user,
  });

  const points = patientData?.points ?? 0;
  const tier = tierInfo(points);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      <PageHeader title="Loyalty Rewards" subtitle="Earn points with every purchase" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard label="Total Points" value={String(points)} icon={Award} tone="primary" />
        <StatCard label="Current Tier" value={tier.name} icon={TrendingUp} tone="amber" />
        <StatCard label={tier.next ? `Points to ${tier.next}` : "Top Tier"} value={tier.next ? String(tier.needed) : "Max"} icon={Gift} tone="violet" />
      </div>

      {tier.next && (
        <div className="rounded-xl bg-card border p-6 shadow-card mb-6">
          <h3 className="font-display font-semibold mb-3">Tier Progress</h3>
          <div className="w-full bg-muted rounded-full h-3">
            <div className="gradient-primary h-3 rounded-full transition-all" style={{ width: `${Math.min(100, (points / (points + tier.needed)) * 100)}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{tier.name}</span>
            <span>{tier.next} ({tier.needed} pts away)</span>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-card border shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b"><h3 className="font-display font-semibold">Transaction History</h3></div>
        {patientData?.transactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No loyalty transactions yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-6 py-3 font-medium">Date</th>
                <th className="text-left px-6 py-3 font-medium">Type</th>
                <th className="text-right px-6 py-3 font-medium">Earned</th>
                <th className="text-right px-6 py-3 font-medium">Redeemed</th>
                <th className="text-right px-6 py-3 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {(patientData?.transactions ?? []).map((tx: any) => (
                <tr key={tx.id} className="border-t hover:bg-muted/30">
                  <td className="px-6 py-3 text-muted-foreground text-xs">{fmtDateTime(tx.created_at)}</td>
                  <td className="px-6 py-3 capitalize">{tx.transaction_type}</td>
                  <td className="px-6 py-3 text-right text-green-600 text-mono">{tx.points_earned > 0 ? `+${tx.points_earned}` : "—"}</td>
                  <td className="px-6 py-3 text-right text-red-600 text-mono">{tx.points_redeemed > 0 ? `-${tx.points_redeemed}` : "—"}</td>
                  <td className="px-6 py-3 text-right font-medium text-mono">{tx.balance_after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

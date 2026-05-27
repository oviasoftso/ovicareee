import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { PageHeader, StatCard } from "@/components/PageShell";
import { Award, FileText, ShoppingBag, Heart } from "lucide-react";

export const Route = createFileRoute("/customer/dashboard")({ component: CustomerDash });

function CustomerDash() {
  const { profile } = useAuth();
  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      <PageHeader title={`Welcome, ${profile?.full_name?.split(" ")[0] ?? "there"} 🌿`} subtitle="Your OviCare account" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard label="Loyalty Points" value="420" icon={Award} tone="primary" />
        <StatCard label="Active Prescriptions" value="2" icon={FileText} tone="violet" />
        <StatCard label="Recent Orders" value="5" icon={ShoppingBag} tone="success" />
        <StatCard label="Tier" value="Silver" hint="280 pts to Gold" icon={Heart} tone="amber" />
      </div>
      <div className="rounded-2xl bg-card border p-8 shadow-card text-center">
        <h3 className="font-display font-semibold text-xl">Your customer portal</h3>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">View prescriptions, track orders, redeem loyalty rewards and update your medical profile.</p>
      </div>
    </div>
  );
}

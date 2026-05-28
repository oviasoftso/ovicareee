import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageShell";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import { fmtMoney, fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/customer/orders")({ component: CustomerOrders });

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  held: "bg-amber-100 text-amber-800",
  refunded: "bg-red-100 text-red-800",
  voided: "bg-gray-100 text-gray-800",
};

function CustomerOrders() {
  const { user } = useAuth();

  const { data: patientId } = useQuery({
    queryKey: ["customer-patient-id", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("patients").select("id").eq("user_id", user.id).single();
      return data?.id ?? null;
    },
    enabled: !!user,
  });

  const { data: orders } = useQuery({
    queryKey: ["customer-orders", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data } = await supabase.from("sales")
        .select("*, sale_items(product_name, quantity, unit_price, total_price)")
        .eq("patient_id", patientId)
        .order("sale_date", { ascending: false });
      return data ?? [];
    },
    enabled: !!patientId,
  });

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      <PageHeader title="My Orders" subtitle="Your purchase history" />
      {(!orders || orders.length === 0) ? (
        <div className="rounded-2xl bg-card border p-12 shadow-card text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-display font-semibold text-lg">No orders yet</h3>
          <p className="mt-2 text-muted-foreground">Your purchase history will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="rounded-xl bg-card border shadow-card overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between border-b">
                <div>
                  <div className="font-mono text-sm text-muted-foreground">{order.receipt_number}</div>
                  <div className="text-sm text-muted-foreground">{fmtDateTime(order.sale_date)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={STATUS_COLORS[order.status] ?? ""}>{order.status}</Badge>
                  <span className="font-display font-bold text-lg">{fmtMoney(order.total_amount)}</span>
                </div>
              </div>
              <div className="px-6 py-3">
                <div className="text-xs text-muted-foreground mb-2">Payment: {order.payment_method?.replace("_", " ")}</div>
                <div className="space-y-1">
                  {(order.sale_items ?? []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1">
                      <span>{item.product_name} x{item.quantity}</span>
                      <span className="text-mono">{fmtMoney(item.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

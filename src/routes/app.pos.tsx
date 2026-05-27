import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, FileCheck, ShoppingCart } from "lucide-react";
import { fmtMoney } from "@/lib/format";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app/pos")({ component: POS });

interface CartItem { id: string; name: string; price: number; qty: number; }

function POS() {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState<"cash" | "card" | "mobile_money" | "insurance">("cash");
  const [submitting, setSubmitting] = useState(false);

  const { data: products } = useQuery({
    queryKey: ["pos-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, selling_price, requires_prescription, sku").eq("is_active", true).limit(60);
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (products ?? []).filter((p: any) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, search]);

  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax - discount;

  const add = (p: any) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === p.id);
      if (ex) return c.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { id: p.id, name: p.name, price: Number(p.selling_price), qty: 1 }];
    });
  };
  const adjust = (id: string, d: number) => setCart((c) => c.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i));
  const remove = (id: string) => setCart((c) => c.filter((i) => i.id !== id));

  const complete = async () => {
    if (!cart.length || !profile?.branch_id) {
      if (!profile?.branch_id) toast.error("Assign a branch to your profile first.");
      return;
    }
    setSubmitting(true);
    const receipt = `HH-POS-${Date.now()}`;
    const { data: sale, error } = await supabase.from("sales").insert({
      receipt_number: receipt, branch_id: profile.branch_id, cashier_id: profile.id,
      subtotal, discount_amount: discount, tax_amount: tax, total_amount: total,
      payment_method: payment, status: "completed",
    } as any).select().single();
    if (error || !sale) { toast.error(error?.message ?? "Sale failed"); setSubmitting(false); return; }
    await supabase.from("sale_items").insert(cart.map((c) => ({
      sale_id: (sale as any).id, product_id: c.id, product_name: c.name,
      quantity: c.qty, unit_price: c.price, total_price: c.price * c.qty,
    })) as any);
    toast.success(`Sale ${receipt} completed · ${fmtMoney(total)}`);
    setCart([]); setDiscount(0); setSubmitting(false);
  };

  return (
    <PageShell>
      <PageHeader title="Point of Sale" subtitle="Quick checkout terminal" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-2xl bg-card border shadow-card flex flex-col min-h-[600px]">
          <div className="p-5 border-b">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Cart ({cart.length})</h3>
          </div>
          <div className="flex-1 overflow-auto p-5">
            {!cart.length && <div className="text-center text-muted-foreground py-16 text-sm">Cart is empty. Add products from the right.</div>}
            {cart.map((i) => (
              <div key={i.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                <div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">{i.name}</div><div className="text-xs text-muted-foreground text-mono">{fmtMoney(i.price)} each</div></div>
                <div className="flex items-center gap-1">
                  <button onClick={() => adjust(i.id, -1)} className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-muted"><Minus className="h-3 w-3" /></button>
                  <span className="w-8 text-center text-mono font-semibold">{i.qty}</span>
                  <button onClick={() => adjust(i.id, 1)} className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-muted"><Plus className="h-3 w-3" /></button>
                </div>
                <div className="w-20 text-right text-mono font-semibold text-sm">{fmtMoney(i.price * i.qty)}</div>
                <button onClick={() => remove(i.id)} className="text-muted-foreground hover:text-danger"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div className="p-5 border-t bg-muted/30 space-y-3">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span className="text-mono">{fmtMoney(subtotal)}</span></div>
            <div className="flex justify-between text-sm items-center"><span>Discount</span>
              <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-24 text-right rounded border px-2 py-1 text-mono text-sm bg-card" />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground"><span>Tax (5%)</span><span className="text-mono">{fmtMoney(tax)}</span></div>
            <div className="flex justify-between text-2xl font-display font-bold pt-2 border-t"><span>Total</span><span className="text-mono text-primary">{fmtMoney(total)}</span></div>
            <div className="grid grid-cols-4 gap-2 pt-2">
              {[["cash", Banknote], ["card", CreditCard], ["mobile_money", Smartphone], ["insurance", FileCheck]].map(([m, I]: any) => (
                <button key={m} onClick={() => setPayment(m)} className={`rounded-lg p-2.5 text-xs font-medium flex flex-col items-center gap-1 border-2 transition ${payment === m ? "border-primary bg-primary/5" : "border-transparent bg-card hover:border-border"}`}>
                  <I className="h-4 w-4" /><span className="capitalize">{(m as string).replace("_", " ")}</span>
                </button>
              ))}
            </div>
            <button disabled={!cart.length || submitting} onClick={complete} className="w-full mt-2 rounded-xl gradient-primary text-white font-semibold py-3.5 shadow-glow disabled:opacity-50">
              {submitting ? "Processing..." : `Complete Sale · ${fmtMoney(total)}`}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl bg-card border shadow-card flex flex-col min-h-[600px]">
          <div className="p-5 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or SKU..." className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3 grid grid-cols-2 gap-2">
            {filtered.map((p: any) => (
              <button key={p.id} onClick={() => add(p)} className="text-left rounded-lg border p-3 hover:border-primary hover:shadow-glow transition bg-card">
                <div className="text-xs text-muted-foreground text-mono">{p.sku}</div>
                <div className="font-medium text-sm mt-1 line-clamp-2">{p.name}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-mono font-semibold text-primary">{fmtMoney(p.selling_price)}</span>
                  {p.requires_prescription && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber/20 text-amber font-semibold">Rx</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

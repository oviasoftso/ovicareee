import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader } from "@/components/PageShell";
import { fmtMoney, fmtNumber } from "@/lib/format";

export const Route = createFileRoute("/app/inventory")({ component: Inventory });

function Inventory() {
  const { data: products } = useQuery({
    queryKey: ["inventory-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, sku, name, dosage_form, strength, reorder_level, selling_price, requires_prescription, categories(name)").order("name").limit(200);
      return data ?? [];
    },
  });
  const { data: stockMap } = useQuery({
    queryKey: ["inventory-stock"],
    queryFn: async () => {
      const { data } = await supabase.from("inventory").select("product_id, quantity_in_stock");
      const map = new Map<string, number>();
      (data ?? []).forEach((r: any) => map.set(r.product_id, (map.get(r.product_id) ?? 0) + Number(r.quantity_in_stock)));
      return map;
    },
  });

  return (
    <PageShell>
      <PageHeader title="Inventory" subtitle="Product catalogue & stock levels across all branches" />
      <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr><th className="text-left px-6 py-3 font-medium">SKU</th><th className="text-left px-6 py-3 font-medium">Product</th><th className="text-left px-6 py-3 font-medium">Category</th><th className="text-left px-6 py-3 font-medium">Form</th><th className="text-right px-6 py-3 font-medium">Stock</th><th className="text-right px-6 py-3 font-medium">Reorder</th><th className="text-right px-6 py-3 font-medium">Price</th><th className="text-center px-6 py-3 font-medium">Status</th></tr>
          </thead>
          <tbody>
            {(products ?? []).map((p: any) => {
              const stock = stockMap?.get(p.id) ?? 0;
              const low = stock <= p.reorder_level;
              return (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="px-6 py-3 text-mono text-xs">{p.sku}</td>
                  <td className="px-6 py-3 font-medium">{p.name} {p.requires_prescription && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber/20 text-amber font-semibold">Rx</span>}</td>
                  <td className="px-6 py-3 text-muted-foreground">{p.categories?.name ?? "—"}</td>
                  <td className="px-6 py-3 text-muted-foreground">{p.dosage_form ?? "—"} {p.strength ?? ""}</td>
                  <td className="px-6 py-3 text-right text-mono font-semibold">{fmtNumber(stock)}</td>
                  <td className="px-6 py-3 text-right text-mono text-muted-foreground">{p.reorder_level}</td>
                  <td className="px-6 py-3 text-right text-mono font-semibold text-primary">{fmtMoney(p.selling_price)}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${stock === 0 ? "bg-danger/10 text-danger" : low ? "bg-amber/15 text-amber" : "bg-success/10 text-success"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${stock === 0 ? "bg-danger" : low ? "bg-amber" : "bg-success"}`} />
                      {stock === 0 ? "Out" : low ? "Low" : "Healthy"}
                    </span>
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

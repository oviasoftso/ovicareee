import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader, StatCard } from "@/components/PageShell";
import { fmtMoney, fmtNumber, fmtDate } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, Clock, ShieldAlert, Truck } from "lucide-react";

export const Route = createFileRoute("/app/inventory")({ component: Inventory });

function Inventory() {
  const { data: products } = useQuery({
    queryKey: ["inventory-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select(
          "id, sku, name, dosage_form, strength, reorder_level, selling_price, requires_prescription, is_controlled, controlled_schedule, barcode, categories(name)",
        )
        .order("name")
        .limit(200);
      return data ?? [];
    },
  });

  const { data: stockMap } = useQuery({
    queryKey: ["inventory-stock"],
    queryFn: async () => {
      const { data } = await supabase.from("inventory").select("product_id, quantity_in_stock");
      const map = new Map<string, number>();
      (data ?? []).forEach((r: any) =>
        map.set(r.product_id, (map.get(r.product_id) ?? 0) + Number(r.quantity_in_stock)),
      );
      return map;
    },
  });

  const { data: expiring } = useQuery({
    queryKey: ["inventory-expiring"],
    queryFn: async () => {
      const { data } = await supabase
        .from("inventory")
        .select(
          "id, batch_number, expiry_date, quantity_in_stock, products(name, sku), branches(name)",
        )
        .lte("expiry_date", new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0])
        .gte("expiry_date", new Date().toISOString().split("T")[0])
        .order("expiry_date", { ascending: true });
      return data ?? [];
    },
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ["inventory-low-stock"],
    queryFn: async () => {
      const { data } = await supabase
        .from("inventory")
        .select(
          "product_id, quantity_in_stock, products(name, sku, reorder_level, reorder_quantity, supplier_id, cost_price, suppliers(name))",
        )
        .lte("quantity_in_stock", 10);
      const grouped: Record<string, any> = {};
      (data ?? []).forEach((r: any) => {
        const pid = r.product_id;
        if (!grouped[pid]) grouped[pid] = { ...r, total: 0 };
        grouped[pid].total += Number(r.quantity_in_stock);
      });
      return Object.values(grouped).filter(
        (g: any) => g.total <= (g.products?.reorder_level ?? 10),
      );
    },
  });

  const lowCount = (products ?? []).filter(
    (p: any) => (stockMap?.get(p.id) ?? 0) <= p.reorder_level,
  ).length;
  const expiringCount = expiring?.length ?? 0;
  const controlledCount = (products ?? []).filter(
    (p: any) => p.is_controlled || p.controlled_schedule,
  ).length;

  return (
    <PageShell>
      <PageHeader
        title="Inventory"
        subtitle="Product catalogue & stock levels across all branches"
      />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-6">
        <StatCard
          label="Total Products"
          value={fmtNumber(products?.length ?? 0)}
          icon={Package}
          tone="primary"
        />
        <StatCard
          label="Low Stock"
          value={fmtNumber(lowCount)}
          hint="Below reorder level"
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="Expiring Soon"
          value={fmtNumber(expiringCount)}
          hint="Within 90 days"
          icon={Clock}
          tone="danger"
        />
        <StatCard
          label="Controlled"
          value={fmtNumber(controlledCount)}
          hint="Schedule I-V"
          icon={ShieldAlert}
          tone="violet"
        />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          <TabsTrigger value="controlled">Controlled Substances</TabsTrigger>
          <TabsTrigger value="reorder">Reorder Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">SKU</th>
                  <th className="text-left px-6 py-3 font-medium">Product</th>
                  <th className="text-left px-6 py-3 font-medium">Category</th>
                  <th className="text-left px-6 py-3 font-medium">Form</th>
                  <th className="text-right px-6 py-3 font-medium">Stock</th>
                  <th className="text-right px-6 py-3 font-medium">Reorder</th>
                  <th className="text-right px-6 py-3 font-medium">Price</th>
                  <th className="text-center px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(products ?? []).map((p: any) => {
                  const stock = stockMap?.get(p.id) ?? 0;
                  const low = stock <= p.reorder_level;
                  return (
                    <tr key={p.id} className="border-t hover:bg-muted/30">
                      <td className="px-6 py-3 text-mono text-xs">{p.sku}</td>
                      <td className="px-6 py-3 font-medium">
                        {p.name}
                        {p.requires_prescription && (
                          <Badge variant="outline" className="ml-1 text-[10px]">
                            Rx
                          </Badge>
                        )}
                        {p.controlled_schedule && (
                          <Badge
                            variant="outline"
                            className="ml-1 text-[10px] bg-violet/10 text-violet"
                          >
                            C-{p.controlled_schedule}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {p.categories?.name ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {p.dosage_form ?? "—"} {p.strength ?? ""}
                      </td>
                      <td className="px-6 py-3 text-right text-mono font-semibold">
                        {fmtNumber(stock)}
                      </td>
                      <td className="px-6 py-3 text-right text-mono text-muted-foreground">
                        {p.reorder_level}
                      </td>
                      <td className="px-6 py-3 text-right text-mono font-semibold text-primary">
                        {fmtMoney(p.selling_price)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${stock === 0 ? "bg-danger/10 text-danger" : low ? "bg-amber/15 text-amber" : "bg-success/10 text-success"}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${stock === 0 ? "bg-danger" : low ? "bg-amber" : "bg-success"}`}
                          />
                          {stock === 0 ? "Out" : low ? "Low" : "Healthy"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="expiring">
          <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
            {!expiring || expiring.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No items expiring within 90 days.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Product</th>
                    <th className="text-left px-6 py-3 font-medium">Batch</th>
                    <th className="text-left px-6 py-3 font-medium">Branch</th>
                    <th className="text-right px-6 py-3 font-medium">Qty</th>
                    <th className="text-right px-6 py-3 font-medium">Expiry</th>
                    <th className="text-center px-6 py-3 font-medium">Urgency</th>
                  </tr>
                </thead>
                <tbody>
                  {expiring.map((item: any) => {
                    const daysLeft = Math.ceil(
                      (new Date(item.expiry_date).getTime() - Date.now()) / 86400000,
                    );
                    const urgency =
                      daysLeft <= 30 ? "critical" : daysLeft <= 60 ? "warning" : "normal";
                    return (
                      <tr key={item.id} className="border-t hover:bg-muted/30">
                        <td className="px-6 py-3 font-medium">{item.products?.name}</td>
                        <td className="px-6 py-3 text-mono text-xs">{item.batch_number ?? "—"}</td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {item.branches?.name ?? "—"}
                        </td>
                        <td className="px-6 py-3 text-right text-mono">{item.quantity_in_stock}</td>
                        <td className="px-6 py-3 text-right text-mono text-xs">
                          {fmtDate(item.expiry_date)}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <Badge
                            className={
                              urgency === "critical"
                                ? "bg-red-100 text-red-800"
                                : urgency === "warning"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                            }
                          >
                            {daysLeft}d
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="controlled">
          <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">SKU</th>
                  <th className="text-left px-6 py-3 font-medium">Product</th>
                  <th className="text-center px-6 py-3 font-medium">Schedule</th>
                  <th className="text-left px-6 py-3 font-medium">Category</th>
                  <th className="text-right px-6 py-3 font-medium">Stock</th>
                  <th className="text-right px-6 py-3 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {(products ?? [])
                  .filter((p: any) => p.is_controlled || p.controlled_schedule)
                  .map((p: any) => (
                    <tr key={p.id} className="border-t hover:bg-muted/30">
                      <td className="px-6 py-3 text-mono text-xs">{p.sku}</td>
                      <td className="px-6 py-3 font-medium">
                        {p.name} {p.strength}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <Badge className="bg-violet/10 text-violet font-mono">
                          {p.controlled_schedule ?? "Yes"}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {p.categories?.name ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-right text-mono font-semibold">
                        {fmtNumber(stockMap?.get(p.id) ?? 0)}
                      </td>
                      <td className="px-6 py-3 text-right text-mono font-semibold text-primary">
                        {fmtMoney(p.selling_price)}
                      </td>
                    </tr>
                  ))}
                {(products ?? []).filter((p: any) => p.is_controlled || p.controlled_schedule)
                  .length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No controlled substances in inventory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="reorder">
          <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
            {!lowStockItems || lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                All stock levels are above reorder thresholds.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Product</th>
                    <th className="text-left px-6 py-3 font-medium">Supplier</th>
                    <th className="text-right px-6 py-3 font-medium">Current Stock</th>
                    <th className="text-right px-6 py-3 font-medium">Reorder Level</th>
                    <th className="text-right px-6 py-3 font-medium">Suggested Qty</th>
                    <th className="text-right px-6 py-3 font-medium">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item: any) => {
                    const product = item.products;
                    const suggestedQty = product?.reorder_quantity ?? 50;
                    const estCost = suggestedQty * Number(product?.cost_price ?? 0);
                    return (
                      <tr key={item.product_id} className="border-t hover:bg-muted/30">
                        <td className="px-6 py-3 font-medium">{product?.name}</td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {product?.suppliers?.name ?? "—"}
                        </td>
                        <td className="px-6 py-3 text-right text-mono text-danger font-semibold">
                          {item.total}
                        </td>
                        <td className="px-6 py-3 text-right text-mono">
                          {product?.reorder_level ?? 0}
                        </td>
                        <td className="px-6 py-3 text-right text-mono font-semibold">
                          {suggestedQty}
                        </td>
                        <td className="px-6 py-3 text-right text-mono text-primary">
                          {fmtMoney(estCost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

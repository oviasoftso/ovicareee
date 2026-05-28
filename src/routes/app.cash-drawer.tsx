import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageShell, PageHeader, StatCard } from "@/components/PageShell";
import { Wallet, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/cash-drawer")({ component: CashDrawer });

function CashDrawer() {
  const { profile, user } = useAuth();
  const qc = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [openingAmount, setOpeningAmount] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [notes, setNotes] = useState("");

  const { data: sessions } = useQuery({
    queryKey: ["cash-drawer-sessions", profile?.branch_id],
    queryFn: async () => {
      if (!profile?.branch_id) return [];
      const { data } = await supabase.from("cash_drawer_sessions")
        .select("*, opened_by_user:profiles!opened_by(full_name), closed_by_user:profiles!closed_by(full_name)")
        .eq("branch_id", profile.branch_id)
        .order("opened_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!profile?.branch_id,
  });

  const openSession = sessions?.find((s: any) => s.status === "open");

  const { data: todaySales } = useQuery({
    queryKey: ["cash-drawer-sales", profile?.branch_id, openSession?.id],
    queryFn: async () => {
      if (!profile?.branch_id || !openSession) return { total: 0, count: 0 };
      const { data } = await supabase.from("sales")
        .select("total_amount, payment_method")
        .eq("branch_id", profile.branch_id)
        .eq("payment_method", "cash")
        .gte("sale_date", openSession.opened_at);
      const total = (data ?? []).reduce((a: number, s: any) => a + Number(s.total_amount), 0);
      return { total, count: data?.length ?? 0 };
    },
    enabled: !!profile?.branch_id && !!openSession,
  });

  const handleOpen = async () => {
    if (!profile?.branch_id || !user) return;
    const { error } = await supabase.from("cash_drawer_sessions").insert({
      branch_id: profile.branch_id,
      opened_by: user.id,
      opening_amount: Number(openingAmount) || 0,
      status: "open",
      notes,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Cash drawer opened");
    setOpenDialog(false);
    setOpeningAmount(""); setNotes("");
    qc.invalidateQueries({ queryKey: ["cash-drawer-sessions"] });
  };

  const handleClose = async () => {
    if (!openSession) return;
    const expected = Number(openSession.opening_amount) + (todaySales?.total ?? 0);
    const variance = Number(closingAmount) - expected;
    const { error } = await supabase.from("cash_drawer_sessions").update({
      closed_by: user?.id,
      closing_amount: Number(closingAmount),
      expected_amount: expected,
      variance,
      closed_at: new Date().toISOString(),
      status: "closed",
    }).eq("id", openSession.id);
    if (error) { toast.error(error.message); return; }
    toast.success(variance === 0 ? "Drawer balanced perfectly" : `Variance: ${fmtMoney(variance)}`);
    setCloseDialog(false);
    setClosingAmount("");
    qc.invalidateQueries({ queryKey: ["cash-drawer-sessions"] });
  };

  return (
    <PageShell>
      <PageHeader title="Cash Drawer" subtitle="Track cash flow per shift" action={
        openSession
          ? <Button onClick={() => setCloseDialog(true)} variant="destructive">Close Drawer</Button>
          : <Button onClick={() => setOpenDialog(true)} className="gradient-primary text-white">Open Drawer</Button>
      } />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-6">
        <StatCard label="Status" value={openSession ? "Open" : "Closed"} icon={Wallet} tone={openSession ? "success" : "amber"} />
        <StatCard label="Opening Amount" value={fmtMoney(openSession?.opening_amount ?? 0)} icon={DollarSign} tone="primary" />
        <StatCard label="Cash Sales" value={fmtMoney(todaySales?.total ?? 0)} hint={`${todaySales?.count ?? 0} transactions`} icon={TrendingUp} tone="violet" />
        <StatCard label="Expected" value={fmtMoney((Number(openSession?.opening_amount ?? 0)) + (todaySales?.total ?? 0))} icon={CheckCircle} tone="success" />
      </div>

      <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b"><h3 className="font-display font-semibold">Session History</h3></div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Opened</th>
              <th className="text-left px-6 py-3 font-medium">Closed</th>
              <th className="text-right px-6 py-3 font-medium">Opening</th>
              <th className="text-right px-6 py-3 font-medium">Closing</th>
              <th className="text-right px-6 py-3 font-medium">Expected</th>
              <th className="text-right px-6 py-3 font-medium">Variance</th>
              <th className="text-center px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(sessions ?? []).map((s: any) => (
              <tr key={s.id} className="border-t hover:bg-muted/30">
                <td className="px-6 py-3 text-xs">{fmtDateTime(s.opened_at)}</td>
                <td className="px-6 py-3 text-xs">{s.closed_at ? fmtDateTime(s.closed_at) : "—"}</td>
                <td className="px-6 py-3 text-right text-mono">{fmtMoney(s.opening_amount)}</td>
                <td className="px-6 py-3 text-right text-mono">{s.closing_amount ? fmtMoney(s.closing_amount) : "—"}</td>
                <td className="px-6 py-3 text-right text-mono">{s.expected_amount ? fmtMoney(s.expected_amount) : "—"}</td>
                <td className={`px-6 py-3 text-right text-mono font-semibold ${s.variance && s.variance !== 0 ? (s.variance > 0 ? "text-green-600" : "text-red-600") : ""}`}>
                  {s.variance != null ? fmtMoney(s.variance) : "—"}
                </td>
                <td className="px-6 py-3 text-center">
                  <Badge className={s.status === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{s.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Open Cash Drawer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Opening Amount</Label><Input type="number" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} placeholder="0.00" /></div>
            <div><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleOpen} className="gradient-primary text-white">Open Drawer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Close Cash Drawer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/30 p-4 text-sm space-y-2">
              <div className="flex justify-between"><span>Opening:</span><span className="text-mono">{fmtMoney(openSession?.opening_amount ?? 0)}</span></div>
              <div className="flex justify-between"><span>Cash Sales:</span><span className="text-mono">{fmtMoney(todaySales?.total ?? 0)}</span></div>
              <div className="flex justify-between font-bold border-t pt-2"><span>Expected:</span><span className="text-mono">{fmtMoney((Number(openSession?.opening_amount ?? 0)) + (todaySales?.total ?? 0))}</span></div>
            </div>
            <div><Label>Actual Cash in Drawer</Label><Input type="number" value={closingAmount} onChange={(e) => setClosingAmount(e.target.value)} placeholder="0.00" /></div>
            {closingAmount && (
              <div className={`rounded-lg p-3 text-sm font-medium ${Number(closingAmount) - (Number(openSession?.opening_amount ?? 0) + (todaySales?.total ?? 0)) === 0 ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
                Variance: {fmtMoney(Number(closingAmount) - (Number(openSession?.opening_amount ?? 0) + (todaySales?.total ?? 0)))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(false)}>Cancel</Button>
            <Button onClick={handleClose} variant="destructive">Close Drawer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

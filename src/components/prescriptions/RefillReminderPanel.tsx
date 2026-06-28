import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check, Clock, Phone } from "lucide-react";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";

export function RefillReminderPanel() {
  const qc = useQueryClient();

  const { data: reminders } = useQuery({
    queryKey: ["refill-reminders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("refill_reminders")
        .select(
          "*, patients(full_name, phone), products(name, strength), prescriptions(prescription_number)",
        )
        .eq("is_sent", false)
        .eq("is_dismissed", false)
        .lte("reminder_date", new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0])
        .order("reminder_date", { ascending: true });
      return data ?? [];
    },
  });

  const dismiss = async (id: string) => {
    await supabase.from("refill_reminders").update({ is_dismissed: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["refill-reminders"] });
    toast.success("Reminder dismissed");
  };

  const markSent = async (id: string) => {
    await supabase.from("refill_reminders").update({ is_sent: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["refill-reminders"] });
    toast.success("Marked as sent");
  };

  if (!reminders || reminders.length === 0) return null;

  return (
    <div className="rounded-xl bg-card border shadow-card overflow-hidden mb-6">
      <div className="px-6 py-4 border-b flex items-center gap-2">
        <Bell className="h-4 w-4 text-amber" />
        <h3 className="font-display font-semibold">Upcoming Refill Reminders</h3>
        <Badge variant="outline">{reminders.length}</Badge>
      </div>
      <div className="divide-y">
        {reminders.map((r: any) => {
          const daysUntil = Math.ceil(
            (new Date(r.reminder_date).getTime() - Date.now()) / 86400000,
          );
          const isOverdue = daysUntil < 0;
          return (
            <div key={r.id} className="px-6 py-3 flex items-center gap-4 hover:bg-muted/30">
              <div
                className={`h-2 w-2 rounded-full ${isOverdue ? "bg-red-500" : daysUntil <= 3 ? "bg-amber" : "bg-green-500"}`}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{r.patients?.full_name ?? "Unknown"}</div>
                <div className="text-xs text-muted-foreground">
                  {r.products?.name} {r.products?.strength}
                  {r.prescriptions?.prescription_number &&
                    ` · ${r.prescriptions.prescription_number}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {fmtDate(r.reminder_date)}
                </div>
                <Badge
                  className={
                    isOverdue
                      ? "bg-red-100 text-red-800"
                      : daysUntil <= 3
                        ? "bg-amber-100 text-amber-800"
                        : "bg-green-100 text-green-800"
                  }
                >
                  {isOverdue ? `${Math.abs(daysUntil)}d overdue` : `${daysUntil}d`}
                </Badge>
              </div>
              <div className="flex gap-1">
                {r.patients?.phone && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => window.open(`tel:${r.patients.phone}`)}
                  >
                    <Phone className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => markSent(r.id)}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => dismiss(r.id)}
                >
                  <span className="text-xs">x</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

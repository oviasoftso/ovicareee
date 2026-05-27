import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageShell, PageHeader, EmptyState } from "@/components/PageShell";
import { Bell, CheckCheck, Loader2, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/app/notifications")({ component: NotificationsPage });

const iconFor = (type: string) => type === "alert" ? AlertCircle : type === "success" ? CheckCircle2 : Info;
const toneFor = (type: string) => type === "alert" ? "text-danger bg-danger/10" : type === "success" ? "text-success bg-success/10" : "text-primary bg-primary/10";

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const markAll = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ is_read: true }).eq("recipient_id", user!.id).eq("is_read", false);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (isLoading) return <PageShell><div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></PageShell>;

  const items = data ?? [];
  const unread = items.filter((n: any) => !n.is_read).length;

  return (
    <PageShell>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : "You're all caught up."}
        action={unread > 0 ? (
          <button onClick={() => markAll.mutate()} className="inline-flex items-center gap-2 rounded-lg gradient-primary text-white px-4 py-2 text-sm font-medium shadow-glow">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        ) : null}
      />

      {items.length === 0 ? (
        <EmptyState title="No notifications" message="System alerts, low-stock warnings and expiry reminders will appear here." icon={Bell} />
      ) : (
        <div className="space-y-2">
          {items.map((n: any) => {
            const Icon = iconFor(n.type);
            return (
              <div key={n.id} className={`rounded-xl border bg-card p-4 flex gap-4 shadow-card ${!n.is_read ? "border-primary/30" : ""}`}>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneFor(n.type)}`}><Icon className="h-5 w-5" /></div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold">{n.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(n.created_at)}</span>
                  </div>
                  {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                </div>
                {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary mt-2" />}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

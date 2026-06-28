import { createFileRoute } from "@tanstack/react-router";
import { useAuth, roleLabel } from "@/lib/auth";
import { PageShell, PageHeader } from "@/components/PageShell";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Building2, Bell, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

function SettingsPage() {
  const { profile, primaryRole, user, refresh } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, phone })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile updated");
      refresh();
    }
  };

  return (
    <PageShell>
      <PageHeader title="Settings" subtitle="Personal preferences and system configuration." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl bg-card border shadow-card p-6">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Profile
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  value={user?.email ?? ""}
                  disabled
                  className="mt-1.5 w-full rounded-lg border bg-muted px-4 py-2.5 text-sm text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
                />
              </div>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg gradient-primary text-white px-5 py-2.5 text-sm font-medium shadow-glow disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-card border shadow-card p-6">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Notifications
            </h3>
            <div className="space-y-3 text-sm">
              {[
                "Low stock alerts",
                "Expiry warnings",
                "Daily sales digest",
                "New prescription assigned",
              ].map((label) => (
                <label
                  key={label}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 accent-[oklch(0.62_0.18_195)]"
                  />
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl bg-card border shadow-card p-6">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Account
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs uppercase">Role</dt>
                <dd className="mt-0.5 font-semibold">{roleLabel(primaryRole)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase">User ID</dt>
                <dd className="mt-0.5 font-mono text-xs truncate">{user?.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase">Status</dt>
                <dd className="mt-0.5">
                  <span className="rounded-full bg-success/10 text-success px-2.5 py-0.5 text-xs font-medium">
                    Active
                  </span>
                </dd>
              </div>
            </dl>
          </section>
          <div className="rounded-2xl bg-secondary text-white p-6 text-sm">
            <div className="font-display font-semibold mb-1">OviCare v1.0</div>
            <div className="text-white/70 text-xs">Powered by Ovia Software Solutions · © 2025</div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

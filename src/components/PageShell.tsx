import { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="p-6 md:p-10 max-w-[1600px] mx-auto">{children}</div>;
}

export function StatCard({ label, value, hint, icon: Icon, tone = "primary" }: { label: string; value: ReactNode; hint?: string; icon: any; tone?: "primary" | "amber" | "violet" | "danger" | "success" }) {
  const tones: Record<string, string> = {
    primary: "from-primary to-primary-light",
    amber: "from-amber to-amber",
    violet: "from-violet to-violet",
    danger: "from-danger to-danger",
    success: "from-success to-success",
  };
  return (
    <div className="rounded-2xl bg-card border p-6 shadow-card hover:shadow-glow transition">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground font-medium">{label}</div>
          <div className="mt-2 text-3xl font-display font-bold text-mono">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${tones[tone]} flex items-center justify-center shadow-glow`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ title, message, icon: Icon }: { title: string; message: string; icon: any }) {
  return (
    <div className="rounded-2xl border-2 border-dashed p-16 text-center bg-card">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
    </div>
  );
}

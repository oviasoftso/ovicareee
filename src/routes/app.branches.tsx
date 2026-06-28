import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Building2, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/app/branches")({ component: Branches });

function Branches() {
  const { data } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => (await supabase.from("branches").select("*").order("name")).data ?? [],
  });
  return (
    <PageShell>
      <PageHeader title="Branches" subtitle="Network management" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(data ?? []).map((b: any) => (
          <div
            key={b.id}
            className="rounded-2xl bg-card border p-6 shadow-card hover:shadow-glow transition"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${b.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
              >
                {b.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <h3 className="mt-4 font-display font-semibold text-lg">{b.name}</h3>
            <div className="text-xs text-mono text-muted-foreground">{b.code}</div>
            <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                {b.address}, {b.city}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                {b.phone}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

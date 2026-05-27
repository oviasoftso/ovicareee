import { Pill } from "lucide-react";

export function Logo({ size = "md", variant = "dark" }: { size?: "sm" | "md" | "lg"; variant?: "dark" | "light" }) {
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" };
  const text = { sm: "text-lg", md: "text-xl", lg: "text-3xl" };
  const sub = { sm: "text-[9px]", md: "text-[10px]", lg: "text-xs" };
  const fg = variant === "light" ? "text-white" : "text-secondary";
  const subFg = variant === "light" ? "text-white/60" : "text-muted-foreground";
  return (
    <div className="flex items-center gap-3">
      <div className={`${sizes[size]} rounded-xl gradient-primary flex items-center justify-center shadow-glow`}>
        <Pill className="text-white" strokeWidth={2.5} />
      </div>
      <div className="leading-tight">
        <div className={`${text[size]} font-display font-bold tracking-tight ${fg}`}>OviCare</div>
        <div className={`${sub[size]} font-light ${subFg}`}>by Ovia Software Solutions</div>
      </div>
    </div>
  );
}

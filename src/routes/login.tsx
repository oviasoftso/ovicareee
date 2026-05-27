import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, roleHomeRoute } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Stethoscope, Heart } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

const DEMO: { label: string; email: string; password: string }[] = [
  { label: "Super Admin",    email: "super@ovicare.com",            password: "OviCare@2025!" },
  { label: "Director",       email: "director@healthhaven.co.zw",   password: "Director@2025!" },
  { label: "Branch Manager", email: "manager@healthhaven.co.zw",    password: "Manager@2025!" },
  { label: "Pharmacist",     email: "pharmacist@healthhaven.co.zw", password: "Pharmacist@2025!" },
  { label: "Cashier",        email: "cashier@healthhaven.co.zw",    password: "Cashier@2025!" },
  { label: "Inventory",      email: "inventory@healthhaven.co.zw",  password: "Inventory@2025!" },
  { label: "Customer",       email: "customer@healthhaven.co.zw",   password: "Customer@2025!" },
];

function LoginPage() {
  const nav = useNavigate();
  const { user, primaryRole, loading } = useAuth();
  const [mode, setMode] = useState<"staff" | "customer">("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && primaryRole) {
      nav({ to: roleHomeRoute(primaryRole) });
    }
  }, [user, primaryRole, loading, nav]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back!");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex gradient-hero items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, oklch(0.76 0.14 180 / 0.6), transparent 50%)" }} />
        <div className="relative z-10 max-w-md text-white">
          <Logo variant="light" size="lg" />
          <h2 className="mt-12 text-4xl font-display font-bold leading-tight">Intelligent Pharmacy.<br/>Healthier Communities.</h2>
          <p className="mt-6 text-white/70 text-lg">Sign in to access your branch, manage prescriptions, run POS and view real-time financials.</p>
          <div className="mt-10 grid grid-cols-2 gap-3 text-sm">
            {DEMO.map((d) => (
              <button key={d.email} type="button" onClick={() => { setEmail(d.email); setPassword(d.password); }}
                className="text-left rounded-lg bg-white/10 backdrop-blur hover:bg-white/15 border border-white/15 px-3 py-2 transition">
                <div className="font-semibold">{d.label}</div>
                <div className="text-white/60 text-xs truncate">{d.email}</div>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-white/50">Click a role to autofill credentials, then "Sign in".</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo /></div>

          <div className="inline-flex rounded-full bg-muted p-1 mb-8">
            <button onClick={() => setMode("staff")} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${mode === "staff" ? "bg-card shadow-card text-foreground" : "text-muted-foreground"}`}>
              <Stethoscope className="h-4 w-4" /> Staff
            </button>
            <button onClick={() => setMode("customer")} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${mode === "customer" ? "bg-card shadow-card text-foreground" : "text-muted-foreground"}`}>
              <Heart className="h-4 w-4" /> Customer
            </button>
          </div>

          <h1 className="text-3xl font-display font-bold">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">Sign in to {mode === "staff" ? "your branch" : "your account"}.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-lg border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="relative mt-1.5">
                <input type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border bg-card px-4 py-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button disabled={submitting} className="w-full rounded-lg gradient-primary text-white font-semibold py-3 shadow-glow disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link to="/register" className="text-primary font-medium hover:underline">Create account</Link>
            <Link to="/" className="text-muted-foreground hover:text-foreground">← Back home</Link>
          </div>

          <p className="mt-12 text-xs text-center text-muted-foreground">OviCare v1.0 · Powered by Ovia Software Solutions</p>
        </div>
      </div>
    </div>
  );
}

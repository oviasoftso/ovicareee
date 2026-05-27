import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/login` },
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success("Account created — check your email to verify."); nav({ to: "/login" }); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <Logo />
        <h1 className="mt-10 text-3xl font-display font-bold">Create your account</h1>
        <p className="mt-2 text-muted-foreground">Join the OviCare network as a customer.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="w-full rounded-lg border bg-card px-4 py-3 text-sm" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border bg-card px-4 py-3 text-sm" />
          <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 chars)" className="w-full rounded-lg border bg-card px-4 py-3 text-sm" />
          <button disabled={submitting} className="w-full rounded-lg gradient-primary text-white font-semibold py-3 shadow-glow flex items-center justify-center gap-2 disabled:opacity-60">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Create account
          </button>
        </form>
        <p className="mt-6 text-sm text-center text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

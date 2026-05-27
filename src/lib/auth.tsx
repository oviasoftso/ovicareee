import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "super_admin" | "director" | "branch_manager" | "pharmacist"
  | "cashier" | "inventory_clerk" | "customer";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  branch_id: string | null;
  is_active: boolean;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

const ROLE_PRIORITY: AppRole[] = [
  "super_admin", "director", "branch_manager",
  "pharmacist", "cashier", "inventory_clerk", "customer",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (uid: string) => {
    const [{ data: prof }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile((prof as Profile) ?? null);
    setRoles(((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role));
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => { loadUserData(s.user.id); }, 0);
      } else {
        setProfile(null); setRoles([]);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadUserData(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const primaryRole = roles.length
    ? [...roles].sort((a, b) => ROLE_PRIORITY.indexOf(a) - ROLE_PRIORITY.indexOf(b))[0]
    : null;

  return (
    <Ctx.Provider value={{
      user, session, profile, roles, primaryRole, loading,
      signOut: async () => { await supabase.auth.signOut(); },
      refresh: async () => { if (user) await loadUserData(user.id); },
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function roleHomeRoute(role: AppRole | null): string {
  switch (role) {
    case "super_admin": return "/app/super-admin";
    case "director": return "/app/financials";
    case "branch_manager": return "/app/dashboard";
    case "pharmacist": return "/app/prescriptions";
    case "cashier": return "/app/pos";
    case "inventory_clerk": return "/app/inventory";
    case "customer": return "/customer/dashboard";
    default: return "/login";
  }
}

export function roleLabel(role: AppRole | null): string {
  if (!role) return "User";
  return role.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

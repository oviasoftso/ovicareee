import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Loader2, Home, FileText, ShoppingBag, Award, User, LogOut } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/customer")({ component: CustomerLayout });

const NAV = [
  { to: "/customer/dashboard", label: "Home", icon: Home },
  { to: "/customer/prescriptions", label: "Prescriptions", icon: FileText },
  { to: "/customer/orders", label: "Orders", icon: ShoppingBag },
  { to: "/customer/loyalty", label: "Loyalty", icon: Award },
  { to: "/customer/profile", label: "Profile", icon: User },
];

function CustomerLayout() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);
  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-card border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
        <nav className="max-w-6xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {NAV.map((n) => {
            const active = path === n.to;
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

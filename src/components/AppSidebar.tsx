import { Link, useRouterState } from "@tanstack/react-router";
import React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  DollarSign,
  Building2,
  UserCog,
  BarChart3,
  Award,
  Bell,
  Settings,
  ShieldAlert,
  LogOut,
  Stethoscope,
  Truck,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth, roleLabel, AppRole } from "@/lib/auth";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: AppRole[];
}
const ALL: AppRole[] = [
  "super_admin",
  "director",
  "branch_manager",
  "pharmacist",
  "cashier",
  "inventory_clerk",
];

const NAV: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ALL },
  {
    to: "/app/pos",
    label: "Point of Sale",
    icon: ShoppingCart,
    roles: ["super_admin", "branch_manager", "cashier", "pharmacist"],
  },
  {
    to: "/app/inventory",
    label: "Inventory",
    icon: Package,
    roles: ["super_admin", "director", "branch_manager", "pharmacist", "inventory_clerk"],
  },
  {
    to: "/app/prescriptions",
    label: "Prescriptions",
    icon: FileText,
    roles: ["super_admin", "director", "branch_manager", "pharmacist"],
  },
  {
    to: "/app/patients",
    label: "Patients",
    icon: Stethoscope,
    roles: ["super_admin", "director", "branch_manager", "pharmacist", "cashier"],
  },
  {
    to: "/app/sales",
    label: "Sales",
    icon: ShoppingCart,
    roles: ["super_admin", "director", "branch_manager", "cashier"],
  },
  {
    to: "/app/financials",
    label: "Financials",
    icon: DollarSign,
    roles: ["super_admin", "director", "branch_manager"],
  },
  { to: "/app/branches", label: "Branches", icon: Building2, roles: ["super_admin", "director"] },
  {
    to: "/app/staff",
    label: "Staff",
    icon: UserCog,
    roles: ["super_admin", "director", "branch_manager"],
  },
  {
    to: "/app/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["super_admin", "director", "branch_manager"],
  },
  {
    to: "/app/loyalty",
    label: "Loyalty",
    icon: Award,
    roles: ["super_admin", "director", "branch_manager"],
  },
  {
    to: "/app/suppliers",
    label: "Suppliers",
    icon: Truck,
    roles: ["super_admin", "director", "branch_manager", "inventory_clerk"],
  },
  {
    to: "/app/cash-drawer",
    label: "Cash Drawer",
    icon: Wallet,
    roles: ["super_admin", "branch_manager", "cashier"],
  },
  {
    to: "/app/performance",
    label: "Performance",
    icon: TrendingUp,
    roles: ["super_admin", "director", "branch_manager"],
  },
  { to: "/app/notifications", label: "Notifications", icon: Bell, roles: ALL },
  {
    to: "/app/settings",
    label: "Settings",
    icon: Settings,
    roles: ["super_admin", "director", "branch_manager"],
  },
  { to: "/app/super-admin", label: "Super Admin", icon: ShieldAlert, roles: ["super_admin"] },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { primaryRole, profile, signOut } = useAuth();
  const items = NAV.filter((n) => primaryRole && n.roles.includes(primaryRole));

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-white/5">
      <div className="px-5 py-6 border-b border-white/5">
        <Logo variant="light" />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {items.map((n) => {
          const active = path === n.to || (n.to !== "/app/dashboard" && path.startsWith(n.to));
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-primary text-primary-foreground shadow-glow" : "text-white/70 hover:bg-sidebar-accent hover:text-white"}`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-white font-semibold text-sm">
            {profile?.full_name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {profile?.full_name ?? "User"}
            </div>
            <div className="text-xs text-white/60">{roleLabel(primaryRole)}</div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-sidebar-accent hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}

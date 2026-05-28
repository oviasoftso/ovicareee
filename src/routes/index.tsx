import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Boxes, BarChart3, Building2, FileText, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({ component: Landing });

const features = [
  { icon: Boxes, title: "Multi-Branch Inventory", desc: "Real-time stock across every branch, with batch & expiry tracking." },
  { icon: Activity, title: "Lightning POS", desc: "Barcode-ready terminal, split payments, instant receipts." },
  { icon: FileText, title: "Prescription Workflow", desc: "Kanban dispensing with allergy & interaction checks." },
  { icon: BarChart3, title: "Financial Intelligence", desc: "P&L, tax, cash flow — drill from network to single sale." },
  { icon: Building2, title: "Branch Network", desc: "Compare performance and rebalance stock across locations." },
  { icon: Sparkles, title: "Loyalty Built-in", desc: "Tier progression, points redemption at checkout." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="absolute top-0 left-0 right-0 z-20 px-6 lg:px-12 py-6 flex items-center justify-between">
        <Logo variant="light" />
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-white/80 hover:text-white">Sign in</Link>
          <Link to="/register" className="rounded-full bg-white text-secondary px-5 py-2 text-sm font-semibold shadow-glow hover:scale-105 transition-transform">Get started</Link>
        </div>
      </header>

      <section className="relative gradient-hero min-h-[88vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, oklch(0.76 0.14 180 / 0.3), transparent 40%), radial-gradient(circle at 80% 70%, oklch(0.55 0.22 295 / 0.2), transparent 40%)" }} />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 px-4 py-1.5 mb-8 text-sm">
            <ShieldCheck className="h-4 w-4 text-primary-glow" /> A product of Ovia Software Solutions
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.05]">
            Intelligent Pharmacy.<br/>
            <span className="bg-gradient-to-r from-primary-glow to-white bg-clip-text text-transparent">Healthier Communities.</span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
            OviCare unifies your branches, inventory, prescriptions, POS and financials in one calm, fast, beautifully designed system.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/login" className="group inline-flex items-center gap-2 rounded-full bg-white text-secondary px-7 py-3.5 font-semibold shadow-glow hover:scale-105 transition-transform">
              Staff Login <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" search={{ mode: "customer" } as any} className="rounded-full border border-white/30 px-7 py-3.5 font-semibold text-white hover:bg-white/10">Customer Portal</Link>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-primary uppercase tracking-widest">Everything you need</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-display font-bold">One platform. Every workflow.</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl bg-card border p-7 shadow-card hover:shadow-glow hover:-translate-y-1 transition-all">
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-5 shadow-glow">
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-display font-semibold">{f.title}</h3>
                <p className="mt-2 text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-secondary text-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12 text-center">
          {[["500+", "Pharmacies"], ["2M+", "Prescriptions"], ["99.9%", "Uptime"]].map(([n, l]) => (
            <div key={l}>
              <div className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-r from-primary-glow to-white bg-clip-text text-transparent">{n}</div>
              <div className="mt-2 text-white/60 font-medium">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-12 px-6 border-t">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo />
          <p className="text-sm text-muted-foreground text-center">
            OviCare v1.0 · Powered by Ovia Software Solutions · © 2025
          </p>
        </div>
      </footer>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useInView, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  Github,
  Layers,
  LineChart,
  Linkedin,
  Lock,
  Mail,
  Network,
  Server,
  ShieldCheck,
  Sparkles,
  Star,
  Rocket,
  Building2,
  Check,
  Terminal,
  Twitter,
  Workflow,
  Zap,
  Menu,
  HelpCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Lock as LockIcon,
  Brain,
  Bot,
  AlertTriangle,
  TrendingUp,
  X as XMark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
const DEMO_VIDEO_SRC = "/videos/app2rack-demo.mp4";

const SEO_TITLE = "App2Rack — Enterprise Infrastructure Intelligence Platform";
const SEO_DESC =
  "Trace any application down to the rack unit it runs on. Live health, AI-powered root cause analysis, dependency graphs and incident response — in one console.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: SEO_TITLE },
      { name: "description", content: SEO_DESC },
      {
        name: "keywords",
        content:
          "infrastructure monitoring, CMDB, root cause analysis, AI ops, observability, data center management, rack visualization, incident response",
      },
      { property: "og:title", content: SEO_TITLE },
      { property: "og:description", content: SEO_DESC },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "App2Rack" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SEO_TITLE },
      { name: "twitter:description", content: SEO_DESC },
      { name: "theme-color", content: "#101825" },
    ],
  }),
  component: Landing,
});

/** Animates a numeric value from 0 to `value` once it scrolls into view. */
function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

const features = [
  {
    icon: Network,
    t: "Dependency mapping",
    b: "Trace any outage from app to rack unit in real time.",
    accent: "var(--chart-1)",
  },
  {
    icon: Activity,
    t: "Live telemetry",
    b: "CPU, memory and network streamed across the fleet.",
    accent: "var(--chart-2)",
  },
  {
    icon: ShieldCheck,
    t: "Incident response",
    b: "Severity-graded timelines with full downtime tracking.",
    accent: "var(--chart-5)",
  },
  {
    icon: Workflow,
    t: "Rack visualization",
    b: "U-level diagrams with thermal & power heatmaps.",
    accent: "var(--chart-3)",
  },
  {
    icon: Database,
    t: "Multi-DC topology",
    b: "Failover zones and capacity at a glance.",
    accent: "var(--chart-4)",
  },
  {
    icon: Gauge,
    t: "Capacity planning",
    b: "Forecast rack, power and cloud headroom before it bites.",
    accent: "var(--chart-1)",
  },
  {
    icon: Boxes,
    t: "Application catalog",
    b: "Tag, group and search every app in your estate.",
    accent: "var(--chart-2)",
  },
  {
    icon: Lock,
    t: "RBAC & audit",
    b: "SAML SSO, fine-grained roles, full audit trail by default.",
    accent: "var(--chart-5)",
  },
];

const steps = [
  {
    n: "01",
    icon: Terminal,
    t: "Connect",
    b: "Stream live metrics or import CSV / XLSX / JSON snapshots in seconds.",
  },
  {
    n: "02",
    icon: Network,
    t: "Map",
    b: "App2Rack auto-builds the full Application → Server → Rack → DC graph.",
  },
  {
    n: "03",
    icon: LineChart,
    t: "Operate",
    b: "Triage, plan capacity and export executive-ready reports from one place.",
  },
];

// Order matches actual page scroll order (features -> workflow -> architecture
// -> proof -> stats -> ai -> why -> pricing -> faq) so the active-section
// highlight and click-to-scroll both progress monotonically down the page.
const NAV_LINKS = [
  { href: "#features", l: "Features" },
  { href: "#workflow", l: "Workflow" },
  { href: "#proof", l: "Customers" },
  { href: "#ai", l: "AI" },
  { href: "#pricing", l: "Pricing" },
  { href: "#faq", l: "FAQ" },
] as const;

const AI_CAPABILITIES = [
  {
    icon: Terminal,
    t: "AI Log Analyzer",
    b: "Paste raw logs — get root cause, severity and remediation steps in seconds.",
    metric: "Root cause in <10s",
    confidence: 94,
    accent: "var(--chart-1)",
  },
  {
    icon: Brain,
    t: "Root Cause Analysis",
    b: "Correlates incidents with live server, rack and dependency telemetry.",
    metric: "3x faster MTTR",
    confidence: 91,
    accent: "var(--chart-4)",
  },
  {
    icon: Gauge,
    t: "Optimization Advisor",
    b: "Continuous scoring across cost, performance, security and reliability.",
    metric: "9-dimension scoring",
    confidence: 88,
    accent: "var(--chart-2)",
  },
  {
    icon: AlertTriangle,
    t: "Incident Detection",
    b: "Severity-graded alerts before thresholds breach, not after.",
    metric: "95% detection accuracy",
    confidence: 95,
    accent: "var(--chart-5)",
  },
  {
    icon: TrendingUp,
    t: "Predictive Insights",
    b: "Forecast rack, power and cloud headroom before it becomes a problem.",
    metric: "60-day capacity forecast",
    confidence: 90,
    accent: "var(--chart-3)",
  },
  {
    icon: Bot,
    t: "AI Copilot",
    b: "Ask InfraBot anything — sizing, cost, HA design, live triage — grounded in your real fleet.",
    metric: "Context-aware answers",
    confidence: 92,
    accent: "var(--chart-1)",
  },
] as const;

const ARCHITECTURE_STEPS = [
  { icon: Boxes, t: "Applications", b: "Your full application catalog, tagged and searchable." },
  { icon: Server, t: "Servers", b: "Every host, its CPU/RAM/storage and live health status." },
  { icon: Workflow, t: "Racks", b: "U-level placement, capacity and thermal load per rack." },
  { icon: Database, t: "Data Center", b: "Multi-site topology with failover zones at a glance." },
  { icon: Activity, t: "Monitoring", b: "Continuous telemetry streamed across the entire fleet." },
  {
    icon: Brain,
    t: "AI Analysis",
    b: "Root cause, optimization and predictive models run on live data.",
  },
  { icon: Sparkles, t: "Insights", b: "Executive-ready recommendations, reports and alerts." },
] as const;

const COMPARISON = [
  {
    old: "Manually maintained CMDB spreadsheets",
    now: "Auto-discovered inventory, always current",
  },
  {
    old: "Siloed dashboards per tool or team",
    now: "One console for apps, servers, racks and DCs",
  },
  {
    old: "Reactive incident response after impact",
    now: "AI-predicted issues before they escalate",
  },
  {
    old: "Spreadsheet-driven capacity planning",
    now: "ML-driven forecasting with 60-day lookahead",
  },
  {
    old: "Static rack diagrams, updated quarterly",
    now: "Live U-level visualization, updated in real time",
  },
  {
    old: "Alert fatigue from disconnected signals",
    now: "Severity-graded, correlated root cause in seconds",
  },
] as const;

const FAQS = [
  {
    q: "How long does it take to get App2Rack running?",
    a: "Most teams are streaming live topology within four minutes — connect via our agent, or drop in a CSV/XLSX/JSON snapshot to backfill your inventory. No firewall rules, no long sales cycle.",
  },
  {
    q: "Do you replace our existing CMDB or observability stack?",
    a: "App2Rack sits on top. We normalize inventory from ServiceNow, NetBox, Kubernetes, cloud providers, and CSVs, then correlate it with live health so your existing dashboards and tickets stay in place.",
  },
  {
    q: "How do AI credits work?",
    a: "Every plan includes monthly credits used by the Log Analyzer, RCA, Optimization Advisor, AI Chat, and Reports. Enterprise gets unlimited credits with dedicated models. Track and top up any time from Billing → Credits.",
  },
  {
    q: "Is my telemetry data secure?",
    a: "Yes. All traffic is TLS 1.3, tenant data is isolated at the workspace level with RBAC and audit logs on every plan except Free, and we're SOC 2 Type II and ISO 27001 certified. Enterprise supports on-prem and BYOK.",
  },
  {
    q: "Can I self-host or run in an air-gapped environment?",
    a: "Yes — Enterprise ships with a Kubernetes-native on-prem deployment, offline license activation, and dedicated AI models that never leave your network.",
  },
  {
    q: "What happens if I hit a plan limit?",
    a: "You'll see a warning at 80% and a soft block at 100% — existing assets keep flowing, but new asset ingestion pauses until you upgrade. Nothing is deleted, ever.",
  },
];

const plans = [
  {
    code: "free",
    name: "Free",
    icon: Star,
    price: "$0",
    period: "forever",
    tagline: "Kick the tires on a single stack.",
    credits: "20 AI credits / month",
    features: [
      "Up to 10 servers",
      "Up to 3 racks",
      "Up to 5 applications",
      "Dashboard & AI chat",
      "Basic reports",
      "Community support",
    ],
    cta: "Get started",
    highlight: false,
    badge: null as string | null,
  },
  {
    code: "pro",
    name: "Pro",
    icon: Rocket,
    price: "$19",
    period: "/mo",
    tagline: "For serious operators running production.",
    credits: "1,000 AI credits / month",
    features: [
      "Unlimited servers, racks & apps",
      "AI Log Analyzer & RCA",
      "Optimization Advisor",
      "AI reports & PDF export",
      "Email notifications",
      "Priority support",
    ],
    cta: "Start Pro",
    highlight: true,
    badge: "Most Popular",
  },
  {
    code: "business",
    name: "Business",
    icon: Building2,
    price: "$79",
    period: "/mo",
    tagline: "Multi-team workspaces with governance.",
    credits: "5,000 AI credits / month",
    features: [
      "Multi-team workspaces",
      "RBAC & audit logs",
      "API access & webhooks",
      "Advanced analytics",
      "Custom dashboards",
      "Unlimited AI chat",
    ],
    cta: "Upgrade",
    highlight: false,
    badge: "Best for Teams",
  },
  {
    code: "enterprise",
    name: "Enterprise",
    icon: Sparkles,
    price: "Custom",
    period: "",
    tagline: "Dedicated infra, SSO, SLA and CSM.",
    credits: "Unlimited AI credits",
    features: [
      "Unlimited everything",
      "Dedicated AI models",
      "SSO & white-label",
      "Dedicated infrastructure",
      "SLA & dedicated CSM",
      "On-prem deployment",
    ],
    cta: "Contact Sales",
    highlight: false,
    badge: null,
  },
];

function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("features");
  const demoVideoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section highlight for nav
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => n !== null);
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* ambient background — fixed so it doesn't fight sticky */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(0.5 0.04 240 / 0.6) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.5 0.04 240 / 0.6) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 20%, black 30%, transparent 75%)",
          }}
        />
        <div className="absolute -top-40 left-1/3 h-[640px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.78_0.15_200/0.22),transparent)]" />
        <div className="absolute top-[40vh] -right-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,oklch(0.65_0.2_290/0.18),transparent)]" />
        <div className="absolute bottom-0 left-0 h-[420px] w-[640px] rounded-full bg-[radial-gradient(closest-side,oklch(0.72_0.17_155/0.12),transparent)]" />
      </div>

      {/* STICKY NAV — always on top */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-border/60 bg-background/85 backdrop-blur-2xl shadow-[0_6px_28px_-14px_oklch(0.05_0.02_250/0.7)]"
            : "border-b border-border/30 bg-background/60 backdrop-blur-xl"
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-300 ${scrolled ? "py-3" : "py-4"}`}
        >
          <Link to="/" className="flex items-center gap-2.5">
            <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary via-chart-4 to-chart-5 shadow-[var(--shadow-glow)]">
              <Activity className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              <span className="absolute -inset-px rounded-lg ring-1 ring-inset ring-white/10" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">App2Rack</div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                Infra Control
              </div>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((i) => {
              const active = activeSection === i.href.slice(1);
              return (
                <a
                  key={i.l}
                  href={i.href}
                  aria-current={active ? "true" : undefined}
                  className={`relative rounded-md px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                  }`}
                >
                  {i.l}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-2 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-primary to-chart-4"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </a>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:inline"
            >
              Sign in
            </Link>
            <Button
              asChild
              size="sm"
              className="hidden bg-gradient-to-r from-primary to-chart-4 text-primary-foreground shadow-[var(--shadow-glow)] sm:inline-flex"
            >
              <Link to="/login" search={{ mode: "signup" }}>
                Get started <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
            {/* Mobile menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-border/60 bg-card/40 backdrop-blur md:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[85vw] max-w-sm border-l border-border/60 bg-background/95 backdrop-blur-2xl"
              >
                <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary via-chart-4 to-chart-5 shadow-[var(--shadow-glow)]">
                      <Activity className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-semibold tracking-tight">App2Rack</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col">
                  {NAV_LINKS.map((i) => {
                    const active = activeSection === i.href.slice(1);
                    return (
                      <SheetClose asChild key={i.l}>
                        <a
                          href={i.href}
                          className={`flex items-center justify-between rounded-lg px-3 py-3 text-base transition ${
                            active
                              ? "bg-card/70 text-foreground"
                              : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                          }`}
                        >
                          {i.l}
                          <ArrowRight className="h-4 w-4 opacity-40" />
                        </a>
                      </SheetClose>
                    );
                  })}
                </nav>
                <div className="mt-6 flex flex-col gap-2 border-t border-border/60 pt-6">
                  <SheetClose asChild>
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/login">Sign in</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-primary to-chart-4 text-primary-foreground shadow-[var(--shadow-glow)]"
                    >
                      <Link to="/login" search={{ mode: "signup" }}>
                        Get started <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Link>
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-6 pb-32 pt-24 lg:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          v4.2 shipped · SOC2 Type II · ISO 27001
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto mt-7 max-w-5xl text-center font-[Space_Grotesk] text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl lg:text-[5.5rem]"
        >
          From the first API call <br className="hidden md:block" />
          to the <span className="text-gradient">last rack unit.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-7 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground"
        >
          The operations console for modern infrastructure teams. Live health, dependency graphs,
          incident response — without switching tabs.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Button
            asChild
            size="lg"
            className="h-12 bg-gradient-to-r from-primary to-chart-4 px-6 text-base text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            <Link to="/login" search={{ mode: "signup" }}>
              Launch console <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setDemoOpen(true)}
            className="h-12 border-border/60 bg-card/40 px-6 text-base backdrop-blur"
          >
            Live demo
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
        >
          {["No credit card", "Free dev tier", "Deploys in 4 minutes"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {t}
            </span>
          ))}
        </motion.div>

        {/* console preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/30 via-chart-4/20 to-chart-5/15 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-2xl shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between border-b border-border/40 bg-card/40 px-5 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                app2rack · console · prod
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-success">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                live
              </span>
            </div>
            <div className="grid gap-0 md:grid-cols-[1.4fr_1fr]">
              <div className="border-b border-border/40 p-6 md:border-b-0 md:border-r">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Live topology
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    trace · 8f3c…a91
                  </span>
                </div>
                <div className="relative space-y-2.5">
                  <div className="pointer-events-none absolute bottom-3 left-[22px] top-3 w-px overflow-hidden">
                    <motion.div
                      animate={{ y: ["-100%", "400%"] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
                      className="h-1/4 w-full bg-gradient-to-b from-transparent via-primary to-transparent"
                    />
                  </div>
                  {[
                    {
                      icon: Boxes,
                      label: "Application",
                      sub: "checkout-api",
                      color: "var(--chart-1)",
                      latency: "12ms",
                    },
                    {
                      icon: Server,
                      label: "Server",
                      sub: "srv-prod-08",
                      color: "var(--chart-4)",
                      latency: "4ms",
                    },
                    {
                      icon: Cpu,
                      label: "VM / Container",
                      sub: "k8s-pod-3a",
                      color: "var(--chart-2)",
                      latency: "2ms",
                    },
                    {
                      icon: Workflow,
                      label: "Rack",
                      sub: "R-204 · U12",
                      color: "var(--chart-3)",
                      latency: "—",
                    },
                    {
                      icon: Database,
                      label: "Data Center",
                      sub: "DC-AMS-1",
                      color: "var(--chart-5)",
                      latency: "—",
                    },
                  ].map((n, i) => (
                    <motion.div
                      key={n.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="relative flex items-center gap-3 rounded-lg border border-border/40 bg-card/60 p-3"
                    >
                      <div
                        className="grid h-9 w-9 place-items-center rounded-md"
                        style={{
                          background: `color-mix(in oklab, ${n.color} 18%, transparent)`,
                          border: `1px solid color-mix(in oklab, ${n.color} 40%, transparent)`,
                        }}
                      >
                        <n.icon className="h-4 w-4" style={{ color: n.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{n.label}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{n.sub}</div>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {n.latency}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="p-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Fleet pulse
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { l: "CPU", value: 38, suffix: "%", c: "var(--chart-1)" },
                    { l: "Memory", value: 61, suffix: "%", c: "var(--chart-4)" },
                    { l: "Net I/O", value: 2.4, decimals: 1, suffix: "Gb/s", c: "var(--chart-2)" },
                    { l: "Power", value: 74, suffix: "kW", c: "var(--chart-5)" },
                  ].map((m) => (
                    <div key={m.l} className="rounded-lg border border-border/40 bg-card/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {m.l}
                      </div>
                      <div className="mt-1 font-mono text-lg font-semibold" style={{ color: m.c }}>
                        <CountUp value={m.value} decimals={m.decimals} suffix={m.suffix} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-lg border border-success/30 bg-success/5 p-4">
                  <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-md bg-success/15 ring-1 ring-success/30">
                      <Zap className="h-3.5 w-3.5 text-success" />
                    </div>
                    <div className="text-xs font-medium text-success">Auto-remediated</div>
                  </div>
                  <div className="mt-2 font-mono text-[10px] text-muted-foreground">
                    rack R-204 · cooling balanced · 1.8s ago
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-border/40 bg-card/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Uptime · 30d
                    </div>
                    <span className="font-mono text-xs text-success">99.98%</span>
                  </div>
                  <div className="mt-2 flex h-6 items-end gap-[2px]">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${60 + Math.sin(i * 0.7) * 35 + Math.cos(i * 0.3) * 5}%`,
                          background:
                            i === 22
                              ? "var(--warning)"
                              : "color-mix(in oklab, var(--success) 70%, transparent)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* logo marquee */}
        <div className="mt-24 border-y border-border/40 py-7">
          <div className="mb-5 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Powering infrastructure teams at
          </div>
          <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
            <div className="flex w-max animate-[marquee_30s_linear_infinite] gap-14 whitespace-nowrap">
              {[...Array(2)].flatMap((_, j) =>
                [
                  "NEXTGRID",
                  "HELIX CLOUD",
                  "ORBIT.IO",
                  "NORTHWIND",
                  "BLACKBOX",
                  "VANTA OPS",
                  "STRATA DC",
                  "ARC LABS",
                ].map((n, i) => (
                  <div
                    key={`${j}-${i}`}
                    className="font-[Space_Grotesk] text-xl font-semibold tracking-[0.2em] text-muted-foreground/50"
                  >
                    {n}
                  </div>
                )),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 pb-32">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
            Platform
          </div>
          <h2 className="mt-4 font-[Space_Grotesk] text-4xl font-semibold tracking-tight md:text-5xl">
            Everything ops needs, <span className="text-gradient">in one console.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            From the API call to the U-slot — observe, trace and act without switching tabs.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (i % 4) * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-card/60"
            >
              <div
                className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(closest-side, ${f.accent}, transparent)` }}
              />
              <div
                className="grid h-11 w-11 place-items-center rounded-lg"
                style={{
                  background: `color-mix(in oklab, ${f.accent} 14%, transparent)`,
                  border: `1px solid color-mix(in oklab, ${f.accent} 35%, transparent)`,
                }}
              >
                <f.icon className="h-5 w-5" style={{ color: f.accent }} />
              </div>
              <h3 className="mt-5 font-[Space_Grotesk] text-lg font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.b}</p>
              <ArrowUpRight className="absolute right-5 top-5 h-4 w-4 -translate-y-1 translate-x-1 text-muted-foreground/30 opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-primary group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 pb-32">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
            Workflow
          </div>
          <h2 className="mt-4 font-[Space_Grotesk] text-4xl font-semibold tracking-tight md:text-5xl">
            Three steps to <span className="text-gradient">operational clarity.</span>
          </h2>
        </div>
        <div className="relative grid gap-6 md:grid-cols-3">
          <div className="pointer-events-none absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border border-border/60 bg-card/40 p-7 backdrop-blur transition hover:-translate-y-1 hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/25 to-chart-4/10 ring-1 ring-primary/30">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="font-[Space_Grotesk] text-4xl font-semibold text-muted-foreground/20">
                  {s.n}
                </div>
              </div>
              <div className="mt-6 font-[Space_Grotesk] text-xl font-semibold">{s.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.b}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PLATFORM ARCHITECTURE */}
      <section id="architecture" className="relative mx-auto max-w-5xl scroll-mt-24 px-6 pb-32">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
            Architecture
          </div>
          <h2 className="mt-4 font-[Space_Grotesk] text-4xl font-semibold tracking-tight md:text-5xl">
            From code to insight, <span className="text-gradient">one continuous graph.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Every layer of your estate feeds the next — nothing is a dead end.
          </p>
        </div>

        <div className="relative">
          {ARCHITECTURE_STEPS.map((s, i) => (
            <div key={s.t} className="relative flex gap-6 pb-10 last:pb-0">
              {i < ARCHITECTURE_STEPS.length - 1 && (
                <div className="absolute left-[27px] top-14 h-[calc(100%-2.5rem)] w-px overflow-hidden bg-border/50">
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: "100%" }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.6, delay: i * 0.12 }}
                    className="w-full bg-gradient-to-b from-primary to-chart-4"
                  />
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-card/80 shadow-[var(--shadow-glow)] backdrop-blur"
              >
                <s.icon className="h-6 w-6 text-primary" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.12 + 0.1 }}
                className="flex-1 rounded-xl border border-border/60 bg-card/40 px-5 py-4 backdrop-blur"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-[Space_Grotesk] text-base font-semibold">{s.t}</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.b}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* PROOF / TESTIMONIALS */}
      <section id="proof" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 pb-32">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
            Customers
          </div>
          <h2 className="mt-4 font-[Space_Grotesk] text-4xl font-semibold tracking-tight md:text-5xl">
            Trusted by teams who <span className="text-gradient">cannot afford downtime.</span>
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              q: "We cut incident triage from 40 minutes to under 3. The rack-level trace is the killer feature.",
              a: "Priya N.",
              r: "VP Infrastructure, NextGrid",
            },
            {
              q: "Finally a CMDB that updates itself. Our auditors stopped asking for spreadsheets.",
              a: "Marcus L.",
              r: "Head of SRE, Helix Cloud",
            },
            {
              q: "Capacity planning that actually predicts. We deferred a $1.2M rack expansion by two quarters.",
              a: "Aisha K.",
              r: "Director DC Ops, Northwind",
            },
          ].map((t, i) => (
            <motion.div
              key={t.a}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative rounded-2xl border border-border/60 bg-card/40 p-7 backdrop-blur transition hover:-translate-y-1 hover:border-primary/40"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="mt-5 text-[15px] leading-relaxed text-foreground/90">"{t.q}"</p>
              <div className="mt-6 flex items-center gap-3 border-t border-border/40 pt-5">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-chart-4/30 text-xs font-semibold ring-1 ring-primary/30">
                  {t.a
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.a}</div>
                  <div className="text-xs text-muted-foreground">{t.r}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-border/60 bg-[var(--gradient-surface)] p-12 backdrop-blur"
        >
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,oklch(0.78_0.15_200/0.28),transparent)]" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,oklch(0.65_0.2_290/0.2),transparent)]" />
          <div className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { value: 99.99, decimals: 2, suffix: "%", v: "Platform availability" },
              { value: 500, suffix: "K+", v: "Infrastructure events processed" },
              { value: 20, suffix: "M+", v: "Metrics ingested daily" },
              { value: 10, suffix: "x", v: "Faster root cause analysis" },
              { value: 95, suffix: "%", v: "Incident detection accuracy" },
              { value: 40, suffix: "+", v: "Data center sites tracked" },
            ].map((s) => (
              <div key={s.v} className="text-center">
                <div className="font-[Space_Grotesk] text-5xl font-semibold text-gradient md:text-6xl">
                  <CountUp value={s.value} decimals={s.decimals} suffix={s.suffix} />
                </div>
                <div className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* AI SHOWCASE */}
      <section id="ai" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 pb-32">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
            AI-Native
          </div>
          <h2 className="mt-4 font-[Space_Grotesk] text-4xl font-semibold tracking-tight md:text-5xl">
            Infrastructure intelligence, <span className="text-gradient">built in.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Every plan ships with AI grounded in your real fleet data — not generic chat, not canned
            answers.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {AI_CAPABILITIES.map((a, i) => (
            <motion.div
              key={a.t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (i % 3) * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-card/60"
            >
              <div
                className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(closest-side, ${a.accent}, transparent)` }}
              />
              <div className="flex items-center justify-between">
                <div
                  className="grid h-11 w-11 place-items-center rounded-lg"
                  style={{
                    background: `color-mix(in oklab, ${a.accent} 14%, transparent)`,
                    border: `1px solid color-mix(in oklab, ${a.accent} 35%, transparent)`,
                  }}
                >
                  <a.icon className="h-5 w-5" style={{ color: a.accent }} />
                </div>
                <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {a.confidence}% conf.
                </span>
              </div>
              <h3 className="mt-5 font-[Space_Grotesk] text-lg font-semibold">{a.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.b}</p>

              <div className="mt-5 space-y-1.5">
                <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                  <span>{a.metric}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted/40">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${a.confidence}%` }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 1, delay: 0.15 + (i % 3) * 0.08, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${a.accent}, oklch(0.65 0.2 290))`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WHY APP2RACK */}
      <section id="why" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 pb-32">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
            Why App2Rack
          </div>
          <h2 className="mt-4 font-[Space_Grotesk] text-4xl font-semibold tracking-tight md:text-5xl">
            Stop stitching tools <span className="text-gradient">together.</span>
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="rounded-2xl border border-border/50 bg-card/20 p-7 backdrop-blur"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Traditional monitoring
            </div>
            <ul className="mt-6 space-y-4">
              {COMPARISON.map((c) => (
                <li key={c.old} className="flex items-start gap-3 text-sm text-muted-foreground/80">
                  <XMark className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                  <span>{c.old}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="relative overflow-hidden rounded-2xl border border-primary/50 bg-card/50 p-7 shadow-[var(--shadow-glow)] backdrop-blur"
          >
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,oklch(0.78_0.15_200/0.25),transparent)]" />
            <div className="relative text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              App2Rack
            </div>
            <ul className="relative mt-6 space-y-4">
              {COMPARISON.map((c, i) => (
                <motion.li
                  key={c.now}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 text-sm font-medium text-foreground/90"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{c.now}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 pb-32">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
            Pricing
          </div>
          <h2 className="mt-4 font-[Space_Grotesk] text-4xl font-semibold tracking-tight md:text-5xl">
            Simple, scalable <span className="text-gradient">pricing.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Start free, upgrade when your fleet does. Every plan includes AI credits for log
            analysis, RCA and optimization.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p, i) => (
            <motion.div
              key={p.code}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.06 }}
              className={`relative overflow-hidden rounded-2xl border bg-card/40 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 ${
                p.highlight
                  ? "border-primary/60 shadow-[var(--shadow-glow)]"
                  : "border-border/60 hover:border-primary/40"
              }`}
            >
              {p.badge && (
                <div
                  className={`absolute right-0 top-0 rounded-bl-lg px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground ${
                    p.highlight
                      ? "bg-gradient-to-r from-primary to-chart-4"
                      : "bg-gradient-to-r from-warning to-primary"
                  }`}
                >
                  {p.badge}
                </div>
              )}
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-chart-4/20 ring-1 ring-primary/20">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-[Space_Grotesk] text-xl font-semibold">{p.name}</h3>
              </div>
              <div className="mb-1 flex items-baseline gap-1">
                <span className="font-[Space_Grotesk] text-4xl font-bold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">{p.tagline}</p>
              <div className="mb-5 rounded-md border border-border/40 bg-card/40 px-3 py-2 text-xs font-medium text-foreground/90">
                {p.credits}
              </div>
              <ul className="mb-6 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span className="text-foreground/85">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`w-full ${p.highlight ? "bg-gradient-to-r from-primary to-chart-4 text-primary-foreground shadow-[var(--shadow-glow)]" : ""}`}
                variant={p.highlight ? "default" : "outline"}
              >
                {p.code === "enterprise" ? (
                  <a href="mailto:sales@app2rack.io?subject=Enterprise%20plan%20inquiry">{p.cta}</a>
                ) : p.code === "free" ? (
                  <Link to="/login" search={{ mode: "signup", redirect: "/dashboard" }}>
                    {p.cta}
                  </Link>
                ) : (
                  <Link
                    to="/billing/pricing"
                    search={{ checkout: p.code as "pro" | "business", cycle: "monthly" }}
                  >
                    {p.cta}
                  </Link>
                )}
              </Button>
            </motion.div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          All plans include a free daily credit allowance. Cancel or change plan any time.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative mx-auto max-w-4xl scroll-mt-24 px-6 pb-32">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
            FAQ
          </div>
          <h2 className="mt-4 font-[Space_Grotesk] text-4xl font-semibold tracking-tight md:text-5xl">
            Answers before you <span className="text-gradient">even ask.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Still curious? Reach the team at{" "}
            <a
              className="text-foreground underline-offset-4 hover:underline"
              href="mailto:hello@app2rack.io"
            >
              hello@app2rack.io
            </a>
            .
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border/60 bg-card/40 p-2 backdrop-blur"
        >
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`faq-${i}`}
                className="border-border/40 px-4 last:border-b-0"
              >
                <AccordionTrigger className="py-5 text-left text-[15px] font-medium hover:no-underline data-[state=open]:text-primary">
                  <span className="flex items-center gap-3">
                    <HelpCircle className="h-4 w-4 shrink-0 text-primary/70" />
                    {f.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 pl-7 pr-2 text-[14.5px] leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>

      {/* FINAL CTA */}
      <section className="relative mx-auto max-w-7xl px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 px-6 py-16 text-center backdrop-blur md:py-20"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,oklch(0.78_0.15_200/0.22),transparent_70%)]" />
          <Layers className="mx-auto h-8 w-8 text-primary" />
          <h3 className="mt-5 font-[Space_Grotesk] text-3xl font-semibold md:text-5xl">
            Step inside the <span className="text-gradient">operations console.</span>
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Every application, server and rack unit in one place. Set up in minutes — no agents, no
            contracts.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 bg-gradient-to-r from-primary to-chart-4 px-6 text-base text-primary-foreground shadow-[var(--shadow-glow)]"
            >
              <Link to="/login" search={{ mode: "signup" }}>
                Get started free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setDemoOpen(true)}
              className="h-12 border-border/60 bg-card/40 px-6 text-base backdrop-blur"
            >
              Live demo
            </Button>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-border/40 bg-card/20 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-primary to-chart-4 shadow-[var(--shadow-glow)]">
                  <Activity className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
                </div>
                <div className="text-sm font-semibold tracking-tight">App2Rack</div>
              </div>
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
                The operations console for modern infrastructure teams. From code to rack,
                end-to-end.
              </p>
              <div className="mt-5 flex items-center gap-3 text-muted-foreground">
                <a aria-label="GitHub" href="#" className="transition hover:text-foreground">
                  <Github className="h-4 w-4" />
                </a>
                <a aria-label="Twitter" href="#" className="transition hover:text-foreground">
                  <Twitter className="h-4 w-4" />
                </a>
                <a aria-label="LinkedIn" href="#" className="transition hover:text-foreground">
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  aria-label="Email"
                  href="mailto:hello@app2rack.io"
                  className="transition hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            {[
              {
                h: "Product",
                items: [
                  { l: "Features", href: "#features", external: true },
                  { l: "Workflow", href: "#workflow", external: true },
                  { l: "Pricing", href: "#pricing", external: true },
                  { l: "FAQ", href: "#faq", external: true },
                  { l: "Changelog", to: "/login" as const },
                ],
              },
              {
                h: "Company",
                items: [
                  { l: "About", href: "#", external: true },
                  { l: "Customers", href: "#proof", external: true },
                  { l: "Careers", href: "#", external: true },
                  { l: "Contact", href: "#", external: true },
                ],
              },
              {
                h: "Resources",
                items: [
                  { l: "Documentation", href: "#", external: true },
                  { l: "API Reference", href: "#", external: true },
                  { l: "Status", href: "#", external: true },
                  { l: "Security", href: "#", external: true },
                ],
              },
            ].map((col) => (
              <div key={col.h}>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {col.h}
                </div>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {col.items.map((it) => (
                    <li key={it.l}>
                      {"to" in it ? (
                        <Link
                          to={it.to as "/login"}
                          className="text-muted-foreground transition hover:text-foreground"
                        >
                          {it.l}
                        </Link>
                      ) : (
                        <a
                          href={it.href}
                          className="text-muted-foreground transition hover:text-foreground"
                        >
                          {it.l}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-xs text-muted-foreground md:flex-row">
            <div>© {new Date().getFullYear()} App2Rack · Infrastructure Management System</div>
            <div className="flex items-center gap-5">
              <a href="#" className="hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground">
                Terms
              </a>
              <a href="#" className="hover:text-foreground">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent
          className="max-w-6xl overflow-hidden border-border/60 bg-gradient-to-b from-background/95 to-card/80 p-0 backdrop-blur-2xl"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            demoVideoRef.current?.focus();
          }}
        >
          <DialogTitle className="sr-only">App2Rack live product demo</DialogTitle>
          <DemoTheatre videoRef={demoVideoRef} src={DEMO_VIDEO_SRC} open={demoOpen} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const DEMO_CHAPTERS = [
  { at: 0.0, label: "Fleet overview", desc: "Live KPIs, utilization charts & server health" },
  {
    at: 0.21,
    label: "Applications, servers & racks",
    desc: "Full inventory with real-time status",
  },
  {
    at: 0.49,
    label: "AI Log Analyzer & Optimization Advisor",
    desc: "AI-generated root cause and recommendations",
  },
  {
    at: 0.77,
    label: "Incidents & administration",
    desc: "Severity timelines, settings and integrations",
  },
] as const;

function DemoTheatre({
  videoRef,
  src,
  open,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  src: string;
  open: boolean;
}) {
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const chapterRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const chapterListRef = useRef<HTMLDivElement | null>(null);

  const effectiveDuration =
    duration > 0 && isFinite(duration) ? duration : videoRef.current?.duration || 0;

  const chapterTimes = DEMO_CHAPTERS.map((c) =>
    effectiveDuration > 0
      ? Math.min(Math.max(0, c.at * effectiveDuration), Math.max(0, effectiveDuration - 0.1))
      : 0,
  );

  let activeChapter = 0;
  if (effectiveDuration > 0) {
    for (let i = 0; i < DEMO_CHAPTERS.length; i++) {
      if (current + 0.05 >= DEMO_CHAPTERS[i].at * effectiveDuration) activeChapter = i;
    }
  }

  useEffect(() => {
    const btn = chapterRefs.current[activeChapter];
    const list = chapterListRef.current;
    if (!btn || !list) return;
    const btnRect = btn.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    if (btnRect.top < listRect.top || btnRect.bottom > listRect.bottom) {
      btn.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeChapter]);

  useEffect(() => {
    if (!open) {
      setPlaying(true);
      setMuted(true);
      setProgress(0);
      setCurrent(0);
    }
  }, [open]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      const d = v.duration || 0;
      if (isFinite(d)) setDuration(d);
      setCurrent(v.currentTime);
      setProgress(d ? (v.currentTime / d) * 100 : 0);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onTime);
    v.addEventListener("durationchange", onTime);
    v.addEventListener("seeked", onTime);
    v.addEventListener("seeking", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    // Prime state in case metadata already loaded before listeners attached.
    onTime();
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onTime);
      v.removeEventListener("durationchange", onTime);
      v.removeEventListener("seeked", onTime);
      v.removeEventListener("seeking", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [videoRef, open]);

  function seek(t: number, index?: number) {
    const v = videoRef.current;
    if (!v) return;
    const d = v.duration || 0;
    if (!isFinite(d) || d === 0) return;
    const target = Math.min(Math.max(0, t), Math.max(0, d - 0.1));
    v.currentTime = target;
    setCurrent(target);
    v.play().catch(() => {});
    if (typeof index === "number") {
      const btn = chapterRefs.current[index];
      if (btn) {
        btn.focus({ preventScroll: true });
        btn.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function restart() {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }

  function fullscreen() {
    videoRef.current?.requestFullscreen?.().catch(() => {});
  }

  function fmt(s: number) {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, "0")}`;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px]">
      {/* Left: theatre */}
      <div className="flex flex-col">
        {/* Chrome bar */}
        <div className="flex items-center gap-3 border-b border-border/50 bg-background/60 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-md border border-border/50 bg-card/60 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
            <LockIcon className="h-3 w-3 text-success" />
            <span className="truncate">console.app2rack.com/dashboard</span>
            <span className="ml-auto flex items-center gap-1 rounded border border-border/60 bg-background/40 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live
            </span>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
            Demo · v2.14
          </span>
        </div>

        {/* Video */}
        <div className="relative aspect-video bg-black">
          {open && (
            <video
              ref={videoRef}
              src={src}
              className="absolute inset-0 h-full w-full focus:outline-none"
              autoPlay
              loop
              muted
              playsInline
              tabIndex={-1}
              aria-label="App2Rack live console demo"
            />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

          {/* Bottom controls */}
          <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
            <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-chart-4 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <button
                type="button"
                onClick={togglePlay}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/15 backdrop-blur transition hover:bg-white/25"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={restart}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20"
                aria-label="Restart"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              <span className="ml-1 font-mono text-[11px] tabular-nums text-white/80">
                {fmt(current)} / {fmt(duration)}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <span className="hidden rounded border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/70 sm:inline">
                  {DEMO_CHAPTERS[activeChapter]?.label}
                </span>
                <button
                  type="button"
                  onClick={fullscreen}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20"
                  aria-label="Fullscreen"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer meta */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/50 bg-background/50 px-4 py-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-success" /> SOC 2 Type II
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LockIcon className="h-3.5 w-3.5 text-success" /> SAML SSO · SCIM
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" /> Streaming from us-east-1
          </span>
          <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-widest md:inline">
            No login required · Sample dataset
          </span>
        </div>
      </div>

      {/* Right: chapters */}
      <aside className="hidden flex-col border-l border-border/50 bg-card/40 lg:flex">
        <div className="border-b border-border/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Product tour
          </p>
          <p className="mt-0.5 text-sm font-semibold">4 chapters · ~69s</p>
        </div>
        <div ref={chapterListRef} className="flex-1 space-y-1 overflow-y-auto scroll-smooth p-2">
          {DEMO_CHAPTERS.map((c, i) => {
            const active = i === activeChapter;
            return (
              <button
                key={c.label}
                type="button"
                ref={(el) => {
                  chapterRefs.current[i] = el;
                }}
                onClick={() => seek(chapterTimes[i], i)}
                aria-current={active ? "true" : undefined}
                className={`group flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-primary/40 bg-gradient-to-r from-primary/15 to-chart-4/10 text-foreground shadow-[0_0_20px_-8px_var(--primary)]"
                    : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-background/40 hover:text-foreground"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border font-mono text-[10px] font-semibold ${
                    active
                      ? "border-primary/50 bg-primary/20 text-primary"
                      : "border-border/60 bg-background/40"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{c.desc}</span>
                </span>
                <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  {fmt(chapterTimes[i])}
                </span>
              </button>
            );
          })}
        </div>
        <div className="border-t border-border/50 p-3">
          <Link
            to="/login"
            className="flex items-center justify-between rounded-md border border-border/60 bg-gradient-to-r from-primary/20 to-chart-4/10 px-3 py-2 text-xs font-medium transition hover:from-primary/30 hover:to-chart-4/20"
          >
            <span>Try it on your fleet</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            14-day trial · No credit card
          </p>
        </div>
      </aside>
    </div>
  );
}

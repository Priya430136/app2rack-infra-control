import { createFileRoute, Link, useNavigate, redirect, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { z } from "zod";
import {
  Activity,
  ArrowLeft,
  Loader2,
  Network,
  Gauge,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { setAuthToken } from "@/lib/auth-token";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

const DEFAULT_REDIRECT = "/dashboard";

function safeRedirectPath(value?: string) {
  if (!value || value.startsWith("//")) return DEFAULT_REDIRECT;
  if (value.startsWith("/")) return value.startsWith("/login") ? DEFAULT_REDIRECT : value;

  try {
    const url = new URL(value);
    const path = `${url.pathname}${url.search}${url.hash}`;
    return path.startsWith("/login") || path === "/" ? DEFAULT_REDIRECT : path;
  } catch {
    return DEFAULT_REDIRECT;
  }
}

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    const token = localStorage.getItem("token");
    if (token) {
      throw redirect({ to: safeRedirectPath(search.redirect) as "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(
    search.mode === "signup" ? "signup" : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const target = safeRedirectPath(search.redirect);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        await api.post("/auth/register", {
          email: email.trim(),
          password,
          name,
        });
        setNotice("Account created. You can sign in now.");
        setMode("signin");
      } else {
        const { data } = await api.post("/auth/login", {
          email: email.trim(),
          password,
        });

        if (!data.token)
          throw new Error("Sign-in failed. Please check your credentials and try again.");

        setAuthToken(data.token);
        await router.invalidate();
        await navigate({ to: target as "/dashboard", replace: true });
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[700px] rounded-full bg-[radial-gradient(closest-side,oklch(0.78_0.15_200/0.15),transparent)]" />
      </div>

      {/* form side */}
      <div className="relative z-10 flex flex-col px-6 py-8 lg:px-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to overview
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="my-auto w-full max-w-sm self-center"
        >
          <div className="mb-8 flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-primary to-chart-4 shadow-[var(--shadow-glow)]">
              <Activity className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">App2Rack</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Infra Control
              </div>
            </div>
          </div>

          <h1 className="font-[Space_Grotesk] text-3xl font-semibold tracking-tight">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Provision your operations console in seconds."
              : "Sign in to your infrastructure console."}
          </p>

          <form onSubmit={handleEmail} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">
                  Full name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Work email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@company.io"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {formError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {formError}
              </div>
            )}
            {notice && !formError && (
              <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                {notice}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-chart-4 text-primary-foreground shadow-[var(--shadow-glow)]"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </motion.div>
      </div>

      {/* visual side */}
      <div className="relative hidden overflow-hidden border-l border-border/60 bg-[var(--gradient-surface)] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.78_0.15_200/0.18),transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative flex h-full flex-col justify-center px-12"
        >
          <div className="font-[Space_Grotesk] text-4xl font-semibold leading-tight tracking-tight">
            Your fleet, <span className="text-gradient">end-to-end.</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Sign in to inspect dependency graphs, rack capacity, live incidents and every
            application running in your estate.
          </p>
          <div className="mt-10 space-y-3">
            {[
              {
                icon: Network,
                title: "Dependency mapping",
                detail: "checkout-api → srv-prod-08 → R-204 · U12",
                accent: "var(--chart-1)",
              },
              {
                icon: Gauge,
                title: "Live fleet telemetry",
                detail: "CPU 62% · RAM 71% · Net 18 Gbps",
                accent: "var(--chart-4)",
              },
              {
                icon: ShieldCheck,
                title: "Incident & capacity intel",
                detail: "2 open · MTTR 1m 48s · 99.98% SLA",
                accent: "var(--chart-2)",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.15 }}
                className="flex items-center gap-4 rounded-xl border border-border/40 bg-card/50 px-4 py-3.5 backdrop-blur transition hover:border-primary/40"
              >
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-md"
                  style={{
                    background: `color-mix(in oklab, ${f.accent} 18%, transparent)`,
                    border: `1px solid color-mix(in oklab, ${f.accent} 40%, transparent)`,
                  }}
                >
                  <f.icon className="h-4 w-4" style={{ color: f.accent }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{f.title}</div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">
                    {f.detail}
                  </div>
                </div>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { ArrowRight, Brain, LogIn, RefreshCw, Sparkles, UserPlus, Zap } from "lucide-react";
import { SiteBrand } from "@/components/site-brand";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/")({
  validateSearch: (search) =>
    ({
      redirect:
        typeof search.redirect === "string" && search.redirect.length > 0
          ? search.redirect
          : undefined,
    }) satisfies { redirect?: string },
  component: HomeRoute,
});

function HomeRoute() {
  const { redirect } = Route.useSearch();
  const redirectSearch = { redirect };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.28),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(16,185,129,0.22),_transparent_60%),_repeating-linear-gradient(90deg,_rgba(148,163,184,0.12)_0,_rgba(148,163,184,0.12)_1px,transparent_1px,transparent_120px),_repeating-linear-gradient(0deg,_rgba(148,163,184,0.12)_0,_rgba(148,163,184,0.12)_1px,transparent_1px,transparent_120px)]" />
      <header className="border-b border-border/70 bg-gradient-to-b from-background/95 via-background/90 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-6 px-4">
          <Link to="/" className="text-foreground" search={redirectSearch}>
            <SiteBrand />
          </Link>
          <nav className="flex items-center gap-2 text-xs sm:text-sm">
            <AuthLoading>
              <span className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-muted/30">
                <Spinner className="size-4 text-muted-foreground" />
              </span>
            </AuthLoading>
            <Unauthenticated>
              <div className="flex items-center gap-2">
                <Button asChild type="button" variant="ghost" size="sm">
                  <Link to="/sign-in" search={redirectSearch}>
                    <LogIn className="size-4" />
                    Sign in
                  </Link>
                </Button>
                <Button asChild type="button" size="sm">
                  <Link to="/sign-up" search={redirectSearch}>
                    <UserPlus className="size-4" />
                    Create account
                  </Link>
                </Button>
              </div>
            </Unauthenticated>
            <Authenticated>
              <Button asChild type="button" size="sm">
                <Link to="/workspace">Go to workspace</Link>
              </Button>
            </Authenticated>
          </nav>
        </div>
      </header>
      <main className="flex flex-1 items-stretch">
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-12 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <span className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground shadow-sm">
              Context Your AI Agent Can Find
            </span>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Stop pasting specs into every chat
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Use AI to draft project plans, specs, and conventions quickly. Store them in Memoria,
              and your AI agent pulls exactly what it needs automatically.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild type="button" size="lg">
                <Link to="/sign-up" search={redirectSearch}>
                  <Sparkles className="size-4" />
                  Get started for free
                </Link>
              </Button>
              <Button asChild type="button" variant="outline" size="lg">
                <Link to="/sign-in" search={redirectSearch}>
                  <LogIn className="size-4" />
                  Sign in
                </Link>
              </Button>
            </div>
          </div>

          {/* Flow Diagram */}
          <div className="relative mx-auto w-full max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
              {/* Step 1: Draft with AI */}
              <div className="group relative">
                <div className="rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-border hover:bg-card/80 shadow-md">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="size-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Draft with AI</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create specs and plans quickly using AI assistance
                  </p>
                </div>
                {/* Arrow */}
                <div className="absolute -right-6 top-1/2 z-10 hidden -translate-y-1/2 sm:block">
                  <ArrowRight className="size-6 text-muted-foreground/40" />
                </div>
              </div>

              {/* Step 2: Store in Memoria */}
              <div className="group relative">
                <div className="rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-border hover:bg-card/80 shadow-md">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <Brain className="size-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Store Once</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Save to Memoria with structured metadata
                  </p>
                </div>
                {/* Arrow */}
                <div className="absolute -right-6 top-1/2 z-10 hidden -translate-y-1/2 sm:block">
                  <ArrowRight className="size-6 text-muted-foreground/40" />
                </div>
              </div>

              {/* Step 3: Agent Pulls Automatically */}
              <div className="group relative">
                <div className="rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-border hover:bg-card/80 shadow-md">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="size-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Agent Pulls</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    AI finds context automatically via MCP
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Simplified Feature Highlights */}
          <div className="mx-auto grid w-full max-w-3xl gap-3 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 p-4 backdrop-blur-sm transition-all hover:border-border/60 hover:bg-card/50"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                  <feature.icon className="size-5 text-foreground/70" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-border/70 bg-background/95">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Built for developers who work with AI agents.</span>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Sparkles,
    title: "AI-Assisted",
    subtitle: "Templates & smart drafts",
  },
  {
    icon: Zap,
    title: "MCP Integration",
    subtitle: "Works with any AI agent",
  },
  {
    icon: RefreshCw,
    title: "Always Current",
    subtitle: "Living documentation",
  },
];

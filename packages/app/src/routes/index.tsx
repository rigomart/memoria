import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, LogIn, RefreshCw, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "../components/landing-header";

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
      <LandingHeader redirect={redirect} />
      <main className="flex flex-1 items-stretch">
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-12 sm:px-6 sm:py-16">
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

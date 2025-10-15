import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Brain } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.28),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(16,185,129,0.22),_transparent_60%),_repeating-linear-gradient(90deg,_rgba(148,163,184,0.12)_0,_rgba(148,163,184,0.12)_1px,transparent_1px,transparent_120px),_repeating-linear-gradient(0deg,_rgba(148,163,184,0.12)_0,_rgba(148,163,184,0.12)_1px,transparent_1px,transparent_120px)]" />
      <header className="border-b border-border/70 bg-gradient-to-b from-background/95 via-background/90 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between gap-6 px-4">
          <Link to="/" className="flex items-center gap-2 rounded-full bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
            <span className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Brain className="size-5" />
              </span>
              <span>Memoria</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-xs sm:text-sm">
            <AuthLoading>
              <span className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-muted/30">
                <Spinner className="size-4 text-muted-foreground" />
              </span>
            </AuthLoading>
            <Unauthenticated>
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <Button type="button" variant="ghost" size="sm">
                    Sign in
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button type="button" size="sm">
                    Create account
                  </Button>
                </SignUpButton>
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
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground shadow-sm">
              Work in context
            </span>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-[34px]">
              Keep meetings from becoming lost knowledge
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Memoria keeps briefs, notes, and follow-ups in one steady place so teams can pick things up without
              rehashing the past.
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Unauthenticated>
                <SignUpButton mode="modal">
                  <Button type="button">Start capturing</Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button type="button" variant="outline">
                    I already use Memoria
                  </Button>
                </SignInButton>
              </Unauthenticated>
              <Authenticated>
                <Button asChild type="button">
                  <Link to="/workspace">Continue in your workspace</Link>
                </Button>
              </Authenticated>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-lg border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur-sm"
              >
                <h2 className="text-base font-medium text-card-foreground">{feature.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-border/70 bg-background/95">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Built for teams who document as they work.</span>
          <div className="flex gap-4">
            <a className="hover:text-foreground" href="mailto:hello@memoria.app">
              Contact
            </a>
            <a className="hover:text-foreground" href="#">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "Shared context",
    description: "Collect project notes beside decisions so handoffs stay quick and confident.",
  },
  {
    title: "Search that helps",
    description: "Jump to the right update with tags, filters, and recent activity in reach.",
  },
  {
    title: "Ready for teams",
    description: "Permissions, Clerk sign-in, and pragmatic defaults keep momentum without extra setup.",
  },
];

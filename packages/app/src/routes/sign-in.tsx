import { SignIn } from "@clerk/clerk-react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { AuthPatternPanel } from "@/components/auth-pattern-panel";
import { Header } from "@/components/header";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search) =>
    ({
      redirect:
        typeof search.redirect === "string" && search.redirect.length > 0
          ? search.redirect
          : undefined,
    }) satisfies { redirect?: string },
  component: SignInRoute,
});

function SignInRoute() {
  const { redirect } = Route.useSearch();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const target = redirect ?? "/workspace";

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="size-16" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={target} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col md:grid md:grid-cols-2">
          <section className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
            <div className="w-full max-w-md space-y-8">
              <div className="space-y-2 text-center md:text-left">
                <span className="inline-flex items-center justify-center rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
                  Sign in
                </span>
                <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground">
                  Sign in to continue building your knowledge workspace.
                </p>
              </div>
              <div className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-xl shadow-primary/10 backdrop-blur">
                <SignIn
                  redirectUrl={target}
                  afterSignInUrl={target}
                  signUpUrl={
                    redirect ? `/sign-up?redirect=${encodeURIComponent(redirect)}` : "/sign-up"
                  }
                  appearance={{
                    elements: {
                      footerAction: "hidden",
                    },
                  }}
                />
              </div>
            </div>
          </section>
          <AuthPatternPanel />
        </div>
      </main>
    </div>
  );
}

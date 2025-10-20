import { SignUp } from "@clerk/clerk-react";
import { shadcn } from "@clerk/themes";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { AuthPatternPanel } from "@/components/auth-pattern-panel";
import { Header } from "@/components/header";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/sign-up")({
  validateSearch: (search) =>
    ({
      redirect:
        typeof search.redirect === "string" && search.redirect.length > 0
          ? search.redirect
          : undefined,
    }) satisfies { redirect?: string },
  component: SignUpRoute,
});

function SignUpRoute() {
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col md:grid md:h-[calc(100vh-4rem)] md:grid-cols-2">
          <section className="flex flex-1 items-center justify-center px-6 py-6 sm:px-10 lg:px-16 xl:px-20">
            <SignUp
              forceRedirectUrl={target}
              fallbackRedirectUrl={target}
              signInUrl={
                redirect ? `/sign-in?redirect=${encodeURIComponent(redirect)}` : "/sign-in"
              }
              appearance={{
                baseTheme: shadcn,
                variables: {
                  colorBackground: "var(--color-card)",
                },
              }}
            />
          </section>
          <AuthPatternPanel />
        </div>
      </main>
    </div>
  );
}

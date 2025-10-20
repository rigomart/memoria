import { SignIn } from "@clerk/clerk-react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";

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
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-border/60 bg-card/60 p-8 text-center shadow-lg shadow-primary/10 backdrop-blur-sm">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to continue building your knowledge workspace.
            </p>
          </div>
          <SignIn
            redirectUrl={target}
            afterSignInUrl={target}
            signUpUrl={redirect ? `/sign-up?redirect=${encodeURIComponent(redirect)}` : "/sign-up"}
            appearance={{
              elements: {
                footerAction: "hidden",
              },
            }}
          />
        </div>
      </main>
    </div>
  );
}

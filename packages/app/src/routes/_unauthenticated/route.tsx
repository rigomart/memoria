import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { LandingHeader } from "@/components/landing-header";
import { Spinner } from "@/components/ui/spinner";
import { AuthPatternPanel } from "@/routes/_unauthenticated/-components/auth-pattern-panel";

export const Route = createFileRoute("/_unauthenticated")({
  validateSearch: (search) =>
    ({
      redirect:
        typeof search.redirect === "string" && search.redirect.length > 0
          ? search.redirect
          : undefined,
    }) satisfies { redirect?: string },
  component: UnauthenticatedLayout,
});

function UnauthenticatedLayout() {
  const { redirect } = Route.useSearch();
  const { isLoading, isAuthenticated } = useConvexAuth();
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
      <LandingHeader redirect={redirect} />
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col md:grid md:h-[calc(100vh-4rem)] md:grid-cols-2">
          <section className="flex flex-1 items-center justify-center px-4 py-6 sm:px-10 lg:px-16 xl:px-20">
            <Outlet />
          </section>
          <AuthPatternPanel />
        </div>
      </main>
    </div>
  );
}

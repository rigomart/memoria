import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { AuthenticatedHeader } from "@/components/authenticated-header";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="size-16" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" search={{ redirect: location.href }} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AuthenticatedHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

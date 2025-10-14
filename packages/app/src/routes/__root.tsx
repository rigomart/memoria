import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { useConvexAuth } from "convex/react";
import { Header } from "@/components/header";

interface RouterContext {
  auth: ReturnType<typeof useConvexAuth>;
}

const RootLayout = () => (
  <div className="flex min-h-screen flex-col bg-background text-foreground">
    <Header />
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Outlet />
    </main>
    <TanStackRouterDevtools />
  </div>
);

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

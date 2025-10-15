import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { ConvexReactClient, useConvexAuth } from "convex/react";

type PageBreadcrumb = {
  label: string;
  path: string;
};

interface RouterContext {
  auth: ReturnType<typeof useConvexAuth>;
  breadcrumb: PageBreadcrumb;
  convex: ConvexReactClient;
}

const RootLayout = () => (
  <div className="flex min-h-screen flex-col bg-background text-foreground">
    <Outlet />
    <TanStackRouterDevtools />
  </div>
);

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

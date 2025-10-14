import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/projects")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/",
        search: { redirect: location.href },
      });
    }
  },
  component: ProjectsLayout,
});

function ProjectsLayout() {
  const { auth } = Route.useRouteContext();

  if (auth.isLoading) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
        Preparing your workspace…
      </div>
    );
  }

  return <Outlet />;
}
